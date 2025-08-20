#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
고급 인물 배경 제거 스크립트
얼굴 검출 + 상반신 추정 + 정밀 세그멘테이션
"""
import sys
import os
import numpy as np
import cv2
from PIL import Image, ImageFilter
import json

def emit_progress(stage, data=None):
    """진행 상황 출력"""
    try:
        payload = {"stage": stage}
        if data:
            payload.update(data)
        print(f"PROGRESS: {json.dumps(payload, ensure_ascii=False)}")
    except:
        pass

def detect_person_region(img_bgr):
    """얼굴 검출 기반 인물 영역 추정"""
    print("👤 인물 영역 검출 시작...")
    
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape
    
    # 1. 얼굴 검출
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
    
    if len(faces) == 0:
        print("⚠️ 얼굴 검출 실패, 중앙 영역 기반 추정")
        # 얼굴 검출 실패 시 중앙 영역 사용
        face_x, face_y = w // 2, h // 3
        face_w, face_h = w // 4, h // 4
    else:
        # 가장 큰 얼굴 선택
        (face_x, face_y, face_w, face_h) = max(faces, key=lambda f: f[2] * f[3])
        print(f"✅ 얼굴 검출 성공: {face_w}x{face_h} at ({face_x}, {face_y})")
    
    # 2. 상반신 영역 추정 (얼굴 기준)
    face_center_x = face_x + face_w // 2
    face_center_y = face_y + face_h // 2
    
    # 상반신 영역 계산 (얼굴 크기 기준)
    body_width = int(face_w * 3.5)    # 얼굴의 3.5배 너비
    body_height = int(face_h * 4.0)   # 얼굴의 4배 높이 (상반신)
    
    # 상반신 영역 좌표
    body_left = max(0, face_center_x - body_width // 2)
    body_right = min(w, face_center_x + body_width // 2)
    body_top = max(0, face_y - face_h // 2)  # 얼굴 위쪽 조금
    body_bottom = min(h, face_y + body_height)
    
    print(f"👤 상반신 영역: ({body_left}, {body_top}) ~ ({body_right}, {body_bottom})")
    
    return {
        'face': (face_x, face_y, face_w, face_h),
        'body': (body_left, body_top, body_right - body_left, body_bottom - body_top),
        'center': (face_center_x, face_center_y)
    }

def create_precise_mask(img_bgr, person_region):
    """정밀한 인물 마스크 생성"""
    print("🎯 정밀 마스크 생성 중...")
    
    h, w = img_bgr.shape[:2]
    mask = np.zeros((h, w), dtype=np.uint8)
    
    # 1. 기본 상반신 영역 설정
    body_left, body_top, body_w, body_h = person_region['body']
    body_right = body_left + body_w
    body_bottom = body_top + body_h
    
    # 2. 상반신 영역을 전경으로 설정
    mask[body_top:body_bottom, body_left:body_right] = 255
    
    # 3. 얼굴 영역 강화 (확실한 전경)
    face_x, face_y, face_w, face_h = person_region['face']
    face_margin = 10
    face_left = max(0, face_x - face_margin)
    face_right = min(w, face_x + face_w + face_margin)
    face_top = max(0, face_y - face_margin)
    face_bottom = min(h, face_y + face_h + face_margin)
    
    mask[face_top:face_bottom, face_left:face_right] = 255
    
    # 4. GrabCut으로 정밀화 (선택적)
    try:
        print("🔧 GrabCut 정밀화 시도...")
        
        # GrabCut 초기 마스크 설정
        grabcut_mask = np.where(mask > 0, cv2.GC_PR_FGD, cv2.GC_BGD).astype(np.uint8)
        
        # 확실한 전경 영역 (얼굴)
        grabcut_mask[face_top:face_bottom, face_left:face_right] = cv2.GC_FGD
        
        # 확실한 배경 영역 (가장자리)
        border = 20
        grabcut_mask[:border, :] = cv2.GC_BGD
        grabcut_mask[-border:, :] = cv2.GC_BGD
        grabcut_mask[:, :border] = cv2.GC_BGD
        grabcut_mask[:, -border:] = cv2.GC_BGD
        
        # GrabCut 실행
        bgdModel = np.zeros((1, 65), np.float64)
        fgdModel = np.zeros((1, 65), np.float64)
        
        cv2.grabCut(img_bgr, grabcut_mask, None, bgdModel, fgdModel, 3, cv2.GC_INIT_WITH_MASK)
        
        # 결과 마스크 생성
        final_mask = np.where((grabcut_mask == cv2.GC_FGD) | (grabcut_mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
        
        print("✅ GrabCut 정밀화 성공")
        mask = final_mask
        
    except Exception as e:
        print(f"⚠️ GrabCut 정밀화 실패, 기본 마스크 사용: {e}")
    
    # 5. 마스크 후처리 (부드러운 경계)
    print("✨ 마스크 후처리 중...")
    
    # 모폴로지 연산으로 구멍 채우기
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=2)
    
    # 가우시안 블러로 부드러운 경계
    mask = cv2.GaussianBlur(mask, (0, 0), sigmaX=2.0, sigmaY=2.0)
    
    return mask

def advanced_background_removal(input_path, output_path):
    """고급 인물 배경 제거"""
    try:
        emit_progress("start", {"input": input_path, "output": output_path})
        
        # 1. 이미지 로드
        print(f"📥 이미지 로드: {input_path}")
        pil_img = Image.open(input_path).convert('RGB')
        img_bgr = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
        h, w = img_bgr.shape[:2]
        
        emit_progress("loaded", {"size": [w, h]})
        
        # 2. 인물 영역 검출
        person_region = detect_person_region(img_bgr)
        emit_progress("person_detected", person_region)
        
        # 3. 정밀 마스크 생성
        mask = create_precise_mask(img_bgr, person_region)
        emit_progress("mask_created")
        
        # 4. 배경 제거 적용
        print("🎨 배경 제거 적용 중...")
        
        # 원본 이미지를 RGBA로 변환
        rgba_img = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGBA)
        
        # 마스크를 알파 채널로 적용
        rgba_img[:, :, 3] = mask
        
        # PIL 이미지로 변환
        result_img = Image.fromarray(rgba_img, 'RGBA')
        
        # 5. 결과 저장
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        result_img.save(output_path, 'PNG')
        
        emit_progress("completed", {"output": output_path})
        print(f"✅ 고급 배경 제거 완료: {output_path}")
        
        return True
        
    except Exception as e:
        print(f"❌ 고급 배경 제거 실패: {e}")
        import traceback
        traceback.print_exc()
        emit_progress("failed", {"error": str(e)})
        return False

def main():
    if len(sys.argv) < 3:
        print('사용법: python advanced_bg_remove.py <input_path> <output_path>')
        sys.exit(1)
    
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    
    print("=== 고급 인물 배경 제거 시작 ===")
    print(f"입력: {input_path}")
    print(f"출력: {output_path}")
    
    if not os.path.exists(input_path):
        print(f"❌ 입력 파일이 존재하지 않습니다: {input_path}")
        sys.exit(1)
    
    if advanced_background_removal(input_path, output_path):
        print("✅ 성공")
        sys.exit(0)
    else:
        print("❌ 실패")
        sys.exit(1)

if __name__ == "__main__":
    main()
