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
    """최소한의 브러시 효과 - 확실한 작동 보장"""
    print("🎨 최소 브러시 효과 적용 중...")
    
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
    
    print("✅ 최소 브러시 효과 완료")
    return final

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
