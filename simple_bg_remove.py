#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
초간단 배경 제거 스크립트 - 즉시 작동 보장
중앙 영역만 보존하는 매우 간단한 방식
"""
import sys
import os
import numpy as np
from PIL import Image

def simple_background_removal(input_path, output_path):
    """초간단 배경 제거 - 중앙 타원 영역만 보존"""
    print(f"🔧 초간단 배경 제거 시작: {input_path}")
    
    try:
        # 이미지 로드
        img = Image.open(input_path).convert('RGBA')
        w, h = img.size
        print(f"📏 이미지 크기: {w}x{h}")
        
        # NumPy 배열로 변환
        img_array = np.array(img)
        
        # 알파 채널 생성 (초기값: 모두 투명)
        alpha = np.zeros((h, w), dtype=np.uint8)
        
        # 중앙 타원 영역 계산 (인물 보존 영역)
        center_x, center_y = w // 2, h // 2
        
        # 타원 크기 (이미지의 70% 영역)
        radius_x = int(w * 0.35)  # 가로 반지름
        radius_y = int(h * 0.40)  # 세로 반지름 (인물 비율 고려)
        
        print(f"🎯 보존 영역: 중앙 타원 ({radius_x*2}x{radius_y*2})")
        
        # 타원 마스크 생성
        for y in range(h):
            for x in range(w):
                # 타원 방정식: (x-cx)²/rx² + (y-cy)²/ry² <= 1
                dx = (x - center_x) / radius_x
                dy = (y - center_y) / radius_y
                
                if dx*dx + dy*dy <= 1:
                    alpha[y, x] = 255  # 불투명 (보존)
                else:
                    # 가장자리 부드럽게 처리
                    distance = np.sqrt(dx*dx + dy*dy)
                    if distance <= 1.2:  # 부드러운 경계
                        fade = max(0, 255 - int((distance - 1) * 255 * 5))
                        alpha[y, x] = fade
                    else:
                        alpha[y, x] = 0  # 투명 (제거)
        
        # 알파 채널 적용
        img_array[:, :, 3] = alpha
        
        # 결과 이미지 생성
        result_img = Image.fromarray(img_array, 'RGBA')
        
        # 출력 디렉토리 생성
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # 저장
        result_img.save(output_path, 'PNG')
        print(f"✅ 배경 제거 완료: {output_path}")
        
        return True
        
    except Exception as e:
        print(f"❌ 배경 제거 실패: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    if len(sys.argv) < 3:
        print('사용법: python simple_bg_remove.py <input_path> <output_path>')
        sys.exit(1)
    
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    
    print("=== 초간단 배경 제거 시작 ===")
    print(f"입력: {input_path}")
    print(f"출력: {output_path}")
    
    if not os.path.exists(input_path):
        print(f"❌ 입력 파일이 존재하지 않습니다: {input_path}")
        sys.exit(1)
    
    if simple_background_removal(input_path, output_path):
        print("✅ 성공")
        sys.exit(0)
    else:
        print("❌ 실패")
        sys.exit(1)

if __name__ == "__main__":
    main()
