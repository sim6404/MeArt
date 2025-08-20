#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
최소 브러시 효과 스크립트 - 즉시 작동 보장
"""
import sys
import os
from PIL import Image, ImageFilter, ImageEnhance
import numpy as np

def apply_minimal_brush_effect(image):
    """고급 브러시 효과 - Neural Style Transfer 시도 후 PIL 폴백"""
    print("🎨 고급 브러시 효과 적용 중...")
    
    # TensorFlow Neural Style Transfer 시도
    try:
        import tensorflow as tf
        import tensorflow_hub as hub
        import numpy as np
        
        print("🧠 TensorFlow Neural Style Transfer 시도...")
        
        # 메모리 최적화 설정
        tf.config.experimental.enable_memory_growth = True
        
        # 이미지를 RGB로 변환하여 처리
        rgb_img = image.convert('RGB')
        img_array = np.array(rgb_img).astype(np.float32) / 255.0
        
        # 크기 조정 (메모리 최적화)
        h, w = img_array.shape[:2]
        max_dim = 384
        if max(h, w) > max_dim:
            scale = max_dim / max(h, w)
            new_h, new_w = int(h * scale), int(w * scale)
            rgb_img = rgb_img.resize((new_w, new_h), Image.LANCZOS)
            img_array = np.array(rgb_img).astype(np.float32) / 255.0
        
        # TensorFlow 텐서로 변환
        content_tensor = tf.convert_to_tensor(img_array[np.newaxis, ...])
        
        # 기본 유화 스타일 생성 (간단한 스타일)
        style_array = np.copy(img_array)
        
        # 유화 스타일 특성 적용
        style_array = apply_oil_painting_transform(style_array)
        style_tensor = tf.convert_to_tensor(style_array[np.newaxis, ...])
        
        # TensorFlow Hub 모델 로드
        model_url = 'https://tfhub.dev/google/magenta/arbitrary-image-stylization-v1-256/2'
        hub_model = hub.load(model_url)
        
        # 스타일 트랜스퍼 실행
        stylized = hub_model(content_tensor, style_tensor)[0]
        
        # 결과 변환
        result_array = (stylized.numpy() * 255).astype(np.uint8)
        result_img = Image.fromarray(result_array)
        
        # 원본 크기로 복원
        if result_img.size != image.size[:2]:
            result_img = result_img.resize(image.size[:2], Image.LANCZOS)
        
        # 알파 채널 복원
        if image.mode == 'RGBA':
            result_img = result_img.convert('RGBA')
            alpha_channel = image.split()[-1]
            result_img.putalpha(alpha_channel)
        
        print("✅ TensorFlow Neural Style Transfer 성공!")
        return result_img
        
    except Exception as e:
        print(f"❌ TensorFlow Neural Style Transfer 실패: {e}")
        print("🔄 PIL 기반 브러시 효과로 대체...")
    
    # PIL 기반 폴백 효과
    
    # 알파 채널 보존
    has_alpha = image.mode == 'RGBA'
    if has_alpha:
        alpha_channel = image.split()[-1]
    
    # RGB로 변환
    image = image.convert('RGB')
    
    # 1. 부드러운 블러 (유화 효과)
    blurred = image.filter(ImageFilter.GaussianBlur(radius=1.5))
    
    # 2. 색상 강화
    enhanced = ImageEnhance.Color(blurred).enhance(1.2)
    enhanced = ImageEnhance.Contrast(enhanced).enhance(1.1)
    enhanced = ImageEnhance.Brightness(enhanced).enhance(1.05)
    
    # 3. 부드러운 효과
    final = enhanced.filter(ImageFilter.SMOOTH)
    
    # 알파 채널 복원
    if has_alpha:
        final = final.convert('RGBA')
        final.putalpha(alpha_channel)
    
    print("✅ PIL 브러시 효과 완료")
    return final

def apply_oil_painting_transform(img_array):
    """유화 스타일 변환 (PIL 기반)"""
    # PIL을 사용한 유화 스타일 변환
    h, w, c = img_array.shape
    
    # 색상 양자화 (유화 특성)
    quantized = np.round(img_array * 6) / 6  # 6단계 색상 양자화
    
    # 약간의 노이즈 추가 (유화 텍스처)
    noise = np.random.normal(0, 0.02, (h, w, c))
    stylized = np.clip(quantized + noise, 0, 1)
    
    return stylized

def main():
    if len(sys.argv) < 3:
        print('사용법: python brush_effect_minimal.py <input_path> <output_path>')
        sys.exit(1)
    
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    
    try:
        print(f"📥 입력 이미지: {input_path}")
        print(f"📤 출력 이미지: {output_path}")
        
        # 입력 파일 확인
        if not os.path.exists(input_path):
            print(f"❌ 입력 파일이 존재하지 않습니다: {input_path}")
            sys.exit(1)
        
        # 이미지 로드
        image = Image.open(input_path).convert('RGBA')
        print(f"✅ 이미지 로드 완료: {image.size}")
        
        # 브러시 효과 적용
        result = apply_minimal_brush_effect(image)
        
        # 출력 디렉토리 생성
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # 결과 저장
        result.save(output_path, 'PNG')
        print(f"✅ 결과 저장 완료: {output_path}")
        
        sys.exit(0)
        
    except Exception as e:
        print(f"❌ 브러시 효과 처리 실패: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
