import React, { useState, useEffect, useRef } from 'react';

const EmotionCanvas = () => {
  const canvasRef = useRef(null);
  const [screenSize, setScreenSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [floatingMessages, setFloatingMessages] = useState([]);
  const [hiddenSpots, setHiddenSpots] = useState([]);
  const [currentEmotion, setCurrentEmotion] = useState('neutral');
  const [emotionIntensity, setEmotionIntensity] = useState(0.5);
  const [isCreatingMessage, setIsCreatingMessage] = useState(false);
  const [secondsExploring, setSecondsExploring] = useState(0);
  const [foundMessages, setFoundMessages] = useState([]);
  const [phase, setPhase] = useState('welcome');
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [messageHistory, setMessageHistory] = useState({});
  const [lastFoundMessages, setLastFoundMessages] = useState([]);
  const [particles, setParticles] = useState([]);
  const [grass, setGrass] = useState([]);
  const [emotionEmojis, setEmotionEmojis] = useState([]);
  const [grassSplit, setGrassSplit] = useState(null);
  const [activeMessagePositions, setActiveMessagePositions] = useState([]);

  // 감정 타입 정의
  const emotionTypes = {
    joy: { color: '#FFD700', intensity: 'bright', particles: 'sparkles' },
    sadness: { color: '#4A90E2', intensity: 'soft', particles: 'tears' },
    anger: { color: '#FF6B6B', intensity: 'sharp', particles: 'flames' },
    fear: { color: '#9B59B6', intensity: 'trembling', particles: 'shadows' },
    anxiety: { color: '#95A5A6', intensity: 'scattered', particles: 'swirls' },
    love: { color: '#E91E63', intensity: 'warm', particles: 'hearts' },
    gratitude: { color: '#27AE60', intensity: 'glowing', particles: 'light' },
    loneliness: { color: '#7F8C8D', intensity: 'hollow', particles: 'mist' },
    peace: { color: '#3498DB', intensity: 'calm', particles: 'bubbles' },
    excitement: { color: '#F39C12', intensity: 'vibrant', particles: 'confetti' },
    neutral: { color: '#BDC3C7', intensity: 'steady', particles: 'dots' }
  };

  // 폰트 로드
  useEffect(() => {
    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600&family=Dancing+Script:wght@400;500;600&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);
    
    return () => {
      if (document.head.contains(fontLink)) {
        document.head.removeChild(fontLink);
      }
    };
  }, []);

  // 화면 크기 감지
  useEffect(() => {
    const handleResize = () => {
      setScreenSize({ width: window.innerWidth, height: window.innerHeight });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 파티클 생성
  useEffect(() => {
    const emotion = emotionTypes[currentEmotion] || emotionTypes.neutral;
    const particleCount = Math.floor(emotionIntensity * 20) + 5;
    const newParticles = [];
    
    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        x: Math.random() * screenSize.width,
        y: Math.random() * screenSize.height,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.3 + 0.1,
        speed: Math.random() * 0.5 + 0.2,
        angle: Math.random() * Math.PI * 2,
        color: emotion.color,
        type: emotion.particles
      });
    }
    
    setParticles(newParticles);
  }, [currentEmotion, emotionIntensity, screenSize]);

  // 잔디 색상 생성
  const getGrassColor = () => {
    const hue = 100 + Math.random() * 30;
    const saturation = 70;
    const lightness = 25 + Math.random() * 20;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  // 잔디밭 생성
  useEffect(() => {
    const grassCount = Math.floor((screenSize.width * screenSize.height) / 500);
    const grassBlades = [];
    
    for (let i = 0; i < grassCount; i++) {
      grassBlades.push({
        x: Math.random() * screenSize.width,
        baseY: screenSize.height - 10 - Math.random() * 200,
        height: 40 + Math.random() * 60,
        angle: 0,
        targetAngle: 0,
        width: 2 + Math.random() * 3,
        sway: Math.random() * Math.PI * 2,
        swaySpeed: 0.02 + Math.random() * 0.03,
        swayIntensity: 0.01 + Math.random() * 0.03,
        springiness: 0.05 + Math.random() * 0.05,
        color: getGrassColor()
      });
    }
    
    setGrass(grassBlades);
  }, [screenSize]);

  // 발견 지점 생성
  useEffect(() => {
    const spots = [];
    const spotCount = Math.floor(emotionIntensity * 20) + 12;
    
    for (let i = 0; i < spotCount; i++) {
      const margin = 40;
      spots.push({
        x: margin + Math.random() * (screenSize.width - 2 * margin),
        y: margin + Math.random() * (screenSize.height - 2 * margin),
        found: false,
        emotionResonance: Math.random()
      });
    }
    setHiddenSpots(spots);
  }, [screenSize, emotionIntensity]);

  // 타이머 관리
  useEffect(() => {
    let timerInterval;
    if (isTimerRunning) {
      const startTimestamp = Date.now() - secondsExploring * 1000;
      timerInterval = setInterval(() => {
        setSecondsExploring(Math.floor((Date.now() - startTimestamp) / 1000));
      }, 1000);
    }
    return () => clearInterval(timerInterval);
  }, [isTimerRunning, secondsExploring]);

  // 그리기 함수들
  const drawHeart = (ctx, x, y, size) => {
    ctx.beginPath();
    ctx.moveTo(x, y + size * 0.3);
    ctx.bezierCurveTo(x, y, x - size * 0.5, y, x - size * 0.5, y + size * 0.3);
    ctx.bezierCurveTo(x - size * 0.5, y + size * 0.7, x, y + size * 1.1, x, y + size * 1.3);
    ctx.bezierCurveTo(x, y + size * 1.1, x + size * 0.5, y + size * 0.7, x + size * 0.5, y + size * 0.3);
    ctx.bezierCurveTo(x + size * 0.5, y, x, y, x, y + size * 0.3);
    ctx.fill();
  };

  const drawStar = (ctx, x, y, size) => {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
      const radius = i % 2 === 0 ? size : size * 0.5;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  };

  const drawTear = (ctx, x, y, size) => {
    ctx.beginPath();
    ctx.arc(x, y + size * 0.5, size * 0.6, 0, Math.PI * 2);
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x - size * 0.3, y + size * 0.3, x, y + size * 0.5);
    ctx.quadraticCurveTo(x + size * 0.3, y + size * 0.3, x, y);
    ctx.fill();
  };

  // AI 메시지 생성
  const createEmotionMessage = async (x, y, resonance) => {
    if (isCreatingMessage) return;
    setIsCreatingMessage(true);
    
    try {
      const emotion = emotionTypes[currentEmotion] || emotionTypes.neutral;
      
      let messageType;
      let messageColor = emotion.color;
      
      if (resonance < 0.4) {
        messageType = 'gentle';
      } else if (resonance < 0.7) {
        messageType = 'understanding';
      } else {
        messageType = 'deep';
        messageColor = '#8E44AD';
      }
      
      // 감정별 메시지 예시
      const emotionExamples = {
        joy: {
          gentle: [
            "기쁨은 삶의 가장 아름다운 순간들을 만들어갑니다",
            "행복은 마음의 선택이며, 지금 이 순간에 존재합니다",
            "당신의 웃음은 세상에 빛을 더하는 소중한 선물입니다"
          ],
          understanding: [
            "진정한 기쁨은 나눌 때 배가 되며, 혼자일 때도 충만합니다",
            "행복한 마음은 다른 이들에게도 희망의 씨앗을 심어줍니다",
            "기쁨 속에서 우리는 삶의 진정한 의미를 발견하게 됩니다"
          ],
          deep: [
            "기쁨은 외부 조건이 아닌 내면의 평화에서 비롯됩니다",
            "행복은 목적지가 아니라 여행 그 자체입니다",
            "진정한 기쁨은 현재를 온전히 받아들일 때 찾아옵니다"
          ]
        },
        sadness: {
          gentle: [
            "슬픔은 우리의 마음이 얼마나 깊이 사랑할 수 있는지 보여주는 증거입니다",
            "눈물은 마음의 정화이며, 새로운 시작을 위한 준비입니다",
            "슬플 때 우리는 가장 인간다운 모습으로 존재하게 됩니다"
          ],
          understanding: [
            "슬픔을 겪는다는 것은 사랑했다는 것의 증명입니다",
            "아픔 속에서 우리는 더 깊은 공감과 연민을 배우게 됩니다",
            "슬픔은 우리를 더 강하고 지혜로운 사람으로 만들어갑니다"
          ],
          deep: [
            "슬픔은 기쁨만큼이나 삶의 소중한 일부이며, 둘 다 우리를 완전하게 만듭니다",
            "고통을 통해 우리는 삶의 진정한 가치와 의미를 깨달아갑니다",
            "슬픔 뒤에는 반드시 새로운 희망의 문이 열려있습니다"
          ]
        },
        anger: {
          gentle: [
            "분노는 당신이 소중히 여기는 것들을 지키려는 마음에서 나옵니다",
            "화가 나는 것은 자연스러운 일이며, 그 감정을 이해하는 것이 중요합니다",
            "분노 속에 숨어있는 진정한 욕구와 필요를 찾아보세요"
          ],
          understanding: [
            "분노는 변화를 위한 에너지이며, 올바른 방향으로 사용할 수 있습니다",
            "화난 마음 뒤에는 상처받은 내면아이가 있음을 기억하세요",
            "분노를 통해 우리는 자신의 경계와 가치관을 명확히 할 수 있습니다"
          ],
          deep: [
            "분노는 억압된 감정들이 표면으로 떠오르는 자연스러운 과정입니다",
            "화를 건설적으로 표현하는 것은 자기 존중과 성장의 표현입니다",
            "분노 뒤의 상처를 치유할 때 진정한 평화를 찾을 수 있습니다"
          ]
        },
        fear: {
          gentle: [
            "두려움은 우리를 보호하려는 마음의 자연스러운 반응입니다",
            "용기는 두려움이 없는 것이 아니라 두려움과 함께 걸어가는 것입니다",
            "불안할 때는 호흡에 집중하며 현재 순간으로 돌아오세요"
          ],
          understanding: [
            "두려움은 우리가 무언가 소중한 것을 지키려 한다는 신호입니다",
            "불안은 우리의 한계를 넘어서려 할 때 자연스럽게 생기는 감정입니다",
            "두려움을 인정하고 받아들이는 것이 용기의 첫걸음입니다"
          ],
          deep: [
            "두려움 너머에는 성장과 자유가 기다리고 있습니다",
            "불안은 우리가 삶을 진지하게 살아가고 있다는 증거입니다",
            "두려움을 마주할 때 우리는 진정한 자신의 모습을 발견하게 됩니다"
          ]
        },
        anxiety: {
          gentle: [
            "불안한 마음은 당신이 미래를 신경 쓰는 책임감 있는 사람임을 보여줍니다",
            "걱정이 많다는 것은 사랑이 많다는 뜻이기도 합니다",
            "불안할 때는 천천히 숨을 쉬며 지금 이 순간에 머물러보세요"
          ],
          understanding: [
            "불안은 우리가 통제할 수 없는 것들에 대한 자연스러운 반응입니다",
            "걱정이 많은 마음은 세심하고 배려깊은 성격의 표현일 수 있습니다",
            "불안감은 우리가 성장하고 변화하려 할 때 자연스럽게 따라오는 감정입니다"
          ],
          deep: [
            "불안은 현재에 집중하라는 마음의 신호이며, 명상의 초대장입니다",
            "걱정은 미래에 사는 것이고, 평화는 현재에 사는 것입니다",
            "불안감을 통해 우리는 진정으로 중요한 것이 무엇인지 깨닫게 됩니다"
          ]
        },
        love: {
          gentle: [
            "사랑하는 마음은 우주에서 가장 아름답고 강력한 에너지입니다",
            "사랑은 주는 것도 받는 것도 모두 축복입니다",
            "당신의 사랑하는 마음이 세상을 더 따뜻한 곳으로 만들어갑니다"
          ],
          understanding: [
            "진정한 사랑은 조건 없이 주어지며, 자유롭게 흘러갑니다",
            "사랑받기 위해서는 먼저 자신을 사랑하는 것이 필요합니다",
            "사랑은 두 사람을 더 나은 존재로 만들어가는 성장의 과정입니다"
          ],
          deep: [
            "사랑은 자아의 경계를 넘어서는 영혼의 확장입니다",
            "진정한 사랑은 상대방의 행복을 자신의 행복처럼 여기는 것입니다",
            "사랑을 통해 우리는 분리된 존재가 아닌 하나임을 깨닫게 됩니다"
          ]
        },
        gratitude: {
          gentle: [
            "감사하는 마음은 일상의 작은 기적들을 발견하게 해줍니다",
            "고마워할 것들을 찾는 눈은 행복을 만들어내는 마법입니다",
            "감사는 현재 가진 것들을 더욱 소중하게 만들어줍니다"
          ],
          understanding: [
            "감사는 부족함이 아닌 풍요로움에 초점을 맞추는 선택입니다",
            "고마운 마음은 더 많은 축복을 끌어당기는 자석과 같습니다",
            "감사 인사는 주는 사람과 받는 사람 모두를 행복하게 만듭니다"
          ],
          deep: [
            "감사는 현재 순간을 신성한 선물로 받아들이는 영적 실천입니다",
            "고마움은 우리를 겸손하게 만들며 삶의 상호연결성을 깨닫게 해줍니다",
            "감사하는 마음은 불완전한 현실을 완전한 축복으로 변화시킵니다"
          ]
        },
        loneliness: {
          gentle: [
            "외로움은 우리가 연결을 갈망하는 사회적 존재임을 알려주는 신호입니다",
            "혼자라고 느낄 때도 우주 전체가 당신과 함께하고 있습니다",
            "외로운 시간은 자신과 깊이 만나는 소중한 기회가 될 수 있습니다"
          ],
          understanding: [
            "외로움은 더 깊은 관계를 원하는 마음의 자연스러운 표현입니다",
            "혼자 있는 시간은 자기 성찰과 내적 성장의 기회입니다",
            "외로움을 느끼는 것은 사랑받고 싶어하는 인간다운 욕구입니다"
          ],
          deep: [
            "외로움 속에서 우리는 진정한 자아와 만나게 되며, 이는 성장의 시작입니다",
            "고독은 선택이고 외로움은 감정이며, 둘 다 삶의 소중한 부분입니다",
            "외로움을 통해 우리는 타인과의 연결이 얼마나 소중한지 깨닫게 됩니다"
          ]
        },
        peace: {
          gentle: [
            "평온한 마음은 폭풍 속에서도 찾을 수 있는 내면의 안식처입니다",
            "고요함 속에서 우리는 삶의 진정한 지혜를 들을 수 있습니다",
            "평화는 외부에서 찾는 것이 아니라 내면에서 기르는 것입니다"
          ],
          understanding: [
            "진정한 평화는 모든 것이 완벽할 때가 아니라 불완전함을 받아들일 때 옵니다",
            "고요한 마음은 명료한 사고와 지혜로운 결정의 근원입니다",
            "평온함은 바쁜 일상 속에서도 유지할 수 있는 내면의 상태입니다"
          ],
          deep: [
            "평화는 저항을 멈추고 현실을 있는 그대로 받아들일 때 찾아옵니다",
            "고요함은 모든 소음 속에서도 변하지 않는 의식의 본질입니다",
            "진정한 평온은 외부 상황에 의존하지 않는 영혼의 자유입니다"
          ]
        },
        excitement: {
          gentle: [
            "설렘은 삶이 우리에게 선사하는 아름다운 에너지입니다",
            "흥분되는 마음은 새로운 가능성들을 향한 열린 자세입니다",
            "열정은 우리를 더 생생하게 살아가게 만드는 생명력입니다"
          ],
          understanding: [
            "흥분은 우리가 삶에 완전히 참여하고 있다는 건강한 신호입니다",
            "설렘은 미래에 대한 희망과 기대가 만들어내는 긍정적 에너지입니다",
            "열정적인 마음은 어려움도 기회로 바꾸어내는 창조적 힘입니다"
          ],
          deep: [
            "진정한 흥분은 현재 순간에 완전히 몰입할 때 경험하는 생명의 충만함입니다",
            "열정은 우리의 영혼이 진정으로 원하는 것과 연결되었을 때 생기는 불꽃입니다",
            "설렘은 우리가 성장과 변화의 문턱에 서 있음을 알려주는 내면의 나침반입니다"
          ]
        }
      };
      
      const currentExamples = emotionExamples[currentEmotion] || emotionExamples.sadness;
      const typeExamples = currentExamples[messageType] || currentExamples.gentle;
      const example = typeExamples[Math.floor(Math.random() * typeExamples.length)];
      
      // 직접 메시지 사용 (API 호출 대신)
      addMessage(example, x, y, messageColor, messageType);
      
    } catch (error) {
      console.error('메시지 생성 오류:', error);
      const fallback = "당신의 감정을 이해하고 함께하겠습니다";
      addMessage(fallback, x, y, '#9C27B0', 'gentle');
    } finally {
      setTimeout(() => setIsCreatingMessage(false), 50);
    }
  };

  // 메시지 표시
  const addMessage = (text, x, y, color, type) => {
    setFoundMessages(prev => [...prev, {
      text: text,
      color: color,
      time: secondsExploring,
      type: type
    }]);
    
    showFloatingMessage(text, x, y, color);
  };

  // 이모티콘 생성
  const createEmotionEmoji = (x, y) => {
    const emojiMap = {
      joy: ['🌻', '🌸', '✨', '💛', ☀️', '🌈'],
      sadness: ['💧', '🌧️', '💙', '🌙', '💜'],
      anger: ['🔥', '⚡', '💥', '🌋'],
      fear: ['🌫️', '👻', '🌪️', '💨'],
      anxiety: ['🌪️', '💭', '😰', '🌊'],
      love: ['💖', '🌹', '💕', '💗', '🥰'],
      gratitude: ['🙏', '✨', '🌟', '💚', '🌺'],
      loneliness: ['🌙', '⭐', '🕯️', '💙', '🌌'],
      peace: ['🕊️', '🌸', '☁️', '🤍', '🌿'],
      excitement: ['🎉', '🎊', '⚡', '🌟', '💥'],
      neutral: ['🌿', '🍃', '💫', '🌱', '✨']
    };
    
    const emojis = emojiMap[currentEmotion] || emojiMap.neutral;
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    
    setEmotionEmojis(prev => [...prev, {
      symbol: randomEmoji,
      x: x + (Math.random() - 0.5) * 30,
      y: y + Math.random() * 10,
      opacity: 1,
      size: 24 + Math.random() * 8,
      speed: 1.5 + Math.random() * 1
    }]);
  };

  // 플로팅 메시지 표시
  const showFloatingMessage = (text, x, y, color) => {
    const maxLength = 25;
    let displayText = text;
    
    if (text.length > maxLength) {
      const breakPoints = ['다는', '하는', '있는', '되는', '에서', '에게', '으로', '이며', '이고'];
      let breakPoint = -1;
      
      for (const point of breakPoints) {
        const index = text.indexOf(point);
        if (index > 10 && index < text.length - 10) {
          breakPoint = index + point.length;
          break;
        }
      }
      
      if (breakPoint > 0) {
        displayText = text.substring(0, breakPoint) + '\n' + text.substring(breakPoint);
      } else {
        const mid = Math.floor(text.length / 2);
        displayText = text.substring(0, mid) + '\n' + text.substring(mid);
      }
    }
    
    // 겹침 방지 위치 조정
    let xPosition = x;
    let yPosition = y - 100;
    const padding = 150;
    const minDistance = 200;
    
    let attempts = 0;
    let positionFound = false;
    
    while (!positionFound && attempts < 10) {
      let hasCollision = false;
      
      for (const existingPos of activeMessagePositions) {
        const distance = Math.hypot(xPosition - existingPos.x, yPosition - existingPos.y);
        if (distance < minDistance) {
          hasCollision = true;
          break;
        }
      }
      
      if (!hasCollision) {
        positionFound = true;
      } else {
        const angle = (attempts * Math.PI * 2) / 8;
        const offset = 80 + (attempts * 20);
        xPosition = x + Math.cos(angle) * offset;
        yPosition = y - 100 + Math.sin(angle) * offset;
        
        if (xPosition < padding) xPosition = padding;
        if (xPosition > screenSize.width - padding) xPosition = screenSize.width - padding;
        if (yPosition < 120) yPosition = 120;
        if (yPosition > screenSize.height - 120) yPosition = screenSize.height - 120;
        
        attempts++;
      }
    }
    
    const newPosition = { x: xPosition, y: yPosition, timestamp: Date.now() };
    setActiveMessagePositions(prev => {
      const currentTime = Date.now();
      const filtered = prev.filter(pos => currentTime - pos.timestamp < 5000);
      return [...filtered, newPosition];
    });
    
    setFloatingMessages(prev => [...prev, {
      text: displayText,
      x: xPosition,
      y: yPosition,
      opacity: 1,
      scale: 0,
      color: color
    }]);
  };

  // 캔버스 애니메이션
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let animationId;
    
    const animate = () => {
      ctx.clearRect(0, 0, screenSize.width, screenSize.height);
      
      // 배경 이미지
      if (backgroundImage) {
        ctx.globalAlpha = 0.8;
        ctx.drawImage(backgroundImage, 0, 0, screenSize.width, screenSize.height);
        ctx.globalAlpha = 1;
      }
      
      // 감정별 배경 오버레이
      if (phase === 'exploring') {
        const emotion = emotionTypes[currentEmotion] || emotionTypes.neutral;
        const gradient = ctx.createRadialGradient(
          screenSize.width / 2, screenSize.height / 2, 0,
          screenSize.width / 2, screenSize.height / 2, screenSize.width
        );
        gradient.addColorStop(0, emotion.color + '20');
        gradient.addColorStop(1, emotion.color + '05');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, screenSize.width, screenSize.height);
      }
      
      // 파티클 그리기
      particles.forEach(particle => {
        ctx.save();
        ctx.globalAlpha = particle.opacity;
        ctx.fillStyle = particle.color;
        
        if (particle.type === 'hearts') {
          drawHeart(ctx, particle.x, particle.y, particle.size);
        } else if (particle.type === 'stars') {
          drawStar(ctx, particle.x, particle.y, particle.size);
        } else if (particle.type === 'tears') {
          drawTear(ctx, particle.x, particle.y, particle.size);
        } else {
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
        }
        
        particle.x += Math.cos(particle.angle) * particle.speed;
        particle.y += Math.sin(particle.angle) * particle.speed;
        
        if (particle.x < 0) particle.x = screenSize.width;
        if (particle.x > screenSize.width) particle.x = 0;
        if (particle.y < 0) particle.y = screenSize.height;
        if (particle.y > screenSize.height) particle.y = 0;
        
        ctx.restore();
      });
      
      // 잔디 그리기
      grass.forEach(blade => {
        const angleDifference = blade.targetAngle - blade.angle;
        blade.angle += angleDifference * blade.springiness;
        
        blade.sway += blade.swaySpeed;
        const naturalSway = Math.sin(blade.sway) * blade.swayIntensity;
        
        ctx.save();
        ctx.translate(blade.x, blade.baseY);
        ctx.rotate(blade.angle + naturalSway);
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(blade.width / 2, -blade.height / 2, 0, -blade.height);
        ctx.quadraticCurveTo(-blade.width / 2, -blade.height / 2, 0, 0);
        
        ctx.fillStyle = blade.color;
        ctx.fill();
        ctx.restore();
      });

      // 이모티콘 그리기
      emotionEmojis.forEach(emoji => {
        ctx.save();
        ctx.globalAlpha = emoji.opacity;
        ctx.font = emoji.size + 'px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji"';
        ctx.textAlign = 'center';
        ctx.fillText(emoji.symbol, emoji.x, emoji.y);
        ctx.restore();
      });
      
      // 플로팅 메시지
      if (phase === 'exploring') {
        floatingMessages.forEach(message => {
          ctx.save();
          
          const padding = 20;
          const textLines = message.text.split('\n');
          const fontSize = 18 + message.scale * 6;
          const lineHeight = fontSize * 1.4;
          const boxHeight = textLines.length * lineHeight + padding * 2;
          
          ctx.font = '500 ' + fontSize + 'px "Noto Sans KR", -apple-system, BlinkMacSystemFont, sans-serif';
          const maxWidth = Math.max(...textLines.map(line => ctx.measureText(line).width));
          const boxWidth = maxWidth + padding * 2;
          
          const boxX = message.x - boxWidth / 2;
          const boxY = message.y - boxHeight - 10;
          
          // 그림자
          ctx.globalAlpha = message.opacity * 0.3;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
          ctx.fillRect(boxX + 3, boxY + 3, boxWidth, boxHeight);
          
          // 메인 박스
          ctx.globalAlpha = message.opacity * 0.95;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
          ctx.shadowBlur = 15;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 5;
          
          // 둥근 박스
          const radius = 12;
          ctx.beginPath();
          ctx.moveTo(boxX + radius, boxY);
          ctx.lineTo(boxX + boxWidth - radius, boxY);
          ctx.quadraticCurveTo(boxX + boxWidth, boxY, boxX + boxWidth, boxY + radius);
          ctx.lineTo(boxX + boxWidth, boxY + boxHeight - radius);
          ctx.quadraticCurveTo(boxX + boxWidth, boxY + boxHeight, boxX + boxWidth - radius, boxY + boxHeight);
          ctx.lineTo(boxX + radius, boxY + boxHeight);
          ctx.quadraticCurveTo(boxX, boxY + boxHeight, boxX, boxY + boxHeight - radius);
          ctx.lineTo(boxX, boxY + radius);
          ctx.quadraticCurveTo(boxX, boxY, boxX + radius, boxY);
          ctx.closePath();
          ctx.fill();
          
          // 테두리
          ctx.globalAlpha = message.opacity * 0.4;
          ctx.strokeStyle = message.color;
          ctx.lineWidth = 2;
          ctx.stroke();
          
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          
          // 텍스트
          ctx.globalAlpha = message.opacity;
          ctx.font = '500 ' + fontSize + 'px "Noto Sans KR", -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#2D3748';
          
          textLines.forEach((line, index) => {
            const yPosition = boxY + padding + fontSize + (index * lineHeight);
            ctx.fillText(line, message.x, yPosition);
          });
          
          // 색상 포인트
          ctx.globalAlpha = message.opacity * 0.8;
          ctx.fillStyle = message.color;
          ctx.beginPath();
          ctx.arc(boxX + boxWidth - 10, boxY + 10, 4, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.restore();
        });
      }
      
      animationId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [particles, floatingMessages, phase, backgroundImage, currentEmotion, screenSize, grass, emotionEmojis]);

  // 애니메이션 업데이트
  useEffect(() => {
    if (phase !== 'exploring') return;
    
    const interval = setInterval(() => {
      setEmotionEmojis(prev => 
        prev.map(emoji => ({
          ...emoji,
          y: emoji.y - emoji.speed,
          opacity: emoji.opacity - 0.01,
          size: emoji.size + 0.2
        })).filter(emoji => emoji.opacity > 0)
      );
      
      setFloatingMessages(prev => 
        prev.map(message => ({
          ...message,
          y: message.y - 0.8,
          opacity: message.opacity - 0.004,
          scale: message.scale + 0.006
        })).filter(message => message.opacity > 0)
      );
    }, 16);
    
    return () => clearInterval(interval);
  }, [phase]);

  // 클릭 이벤트
  const handleCanvasClick = (e) => {
    if (phase !== 'exploring') return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    hiddenSpots.forEach((spot, index) => {
      if (!spot.found) {
        const distance = Math.hypot(spot.x - x, spot.y - y);
        if (distance < 110) {
          createEmotionMessage(spot.x, spot.y, spot.emotionResonance);
          createEmotionEmoji(spot.x, spot.y);
          
          const newSpots = [...hiddenSpots];
          const margin = 40;
          newSpots[index] = {
            x: margin + Math.random() * (screenSize.width - 2 * margin),
            y: margin + Math.random() * (screenSize.height - 2 * margin),
            found: false,
            emotionResonance: Math.random()
          };
          setHiddenSpots(newSpots);
        }
      }
    });
  };

  // 마우스 움직임
  const handleCanvasMouseMove = (e) => {
    if (phase !== 'exploring') return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newGrass = grass.map(blade => {
      const distance = Math.hypot(blade.x - x, blade.baseY - y);
      const radius = 100;
      
      if (distance < radius) {
        const strength = (radius - distance) / radius;
        const dx = blade.x - x;
        const angle = Math.atan2(dx, 50) * strength * 0.5;
        
        return {
          ...blade,
          targetAngle: angle
        };
      }
      
      return {
        ...blade,
        targetAngle: 0
      };
    });
    
    setGrass(newGrass);
  };

  // 마우스 떠날 때
  const handleMouseLeave = () => {
    const newGrass = grass.map(blade => ({
      ...blade,
      targetAngle: 0
    }));
    setGrass(newGrass);
  };

  // 타이머 포맷
  const formatTimer = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return minutes + ':' + seconds.toString().padStart(2, '0');
  };

  // 파일 업로드
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          setBackgroundImage(img);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  // 게임 제어
  const startExploration = () => {
    setTransitioning(true);
    setTimeout(() => {
      setPhase('exploring');
      setIsTimerRunning(true);
      setTransitioning(false);
    }, 500);
  };

  const finishExploration = () => {
    setTransitioning(true);
    setTimeout(() => {
      setPhase('results');
      setIsTimerRunning(false);
      setTransitioning(false);
    }, 500);
  };

  const restartGame = () => {
    setTransitioning(true);
    setTimeout(() => {
      setPhase('welcome');
      setSecondsExploring(0);
      setFoundMessages([]);
      setFloatingMessages([]);
      setEmotionEmojis([]);
      setActiveMessagePositions([]);
      setMessageHistory({});
      setLastFoundMessages([]);
      setTransitioning(false);
    }, 500);
  };

  return (
    <div className="fixed inset-0 overflow-hidden">
      <canvas
        ref={canvasRef}
        width={screenSize.width}
        height={screenSize.height}
        className="absolute inset-0 cursor-pointer"
        onMouseMove={handleCanvasMouseMove}
        onClick={handleCanvasClick}
        onTouchMove={(e) => {
          e.preventDefault();
          const touch = e.touches[0];
          handleCanvasMouseMove(touch);
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          if (e.changedTouches[0]) {
            handleCanvasClick(e.changedTouches[0]);
          }
          handleMouseLeave();
        }}
        onMouseLeave={handleMouseLeave}
        style={{ background: 'transparent' }}
      />
      
      {phase === 'welcome' && (
        <div className={'absolute inset-0 flex items-center justify-center backdrop-blur-sm transition-opacity duration-500 ' + (transitioning ? 'opacity-0' : 'opacity-100')}>
          <div className="text-center p-8 bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl max-w-lg mx-4 transform transition-all duration-500 hover:scale-105 border border-white/60">
            <h1 className="text-4xl font-medium mb-6 text-gray-800 tracking-tight" style={{ fontFamily: 'Dancing Script, cursive' }}>
              Emotion Canvas
            </h1>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed" style={{ fontFamily: 'Noto Sans KR, sans-serif' }}>
              당신의 감정에 공감하는<br />따뜻한 메시지를 찾아보세요
            </p>
            
            <div className="mb-6">
              <label className="block text-sm text-gray-600 mb-3 font-medium" style={{ fontFamily: 'Noto Sans KR, sans-serif' }}>
                현재 감정 상태
              </label>
              <select
                value={currentEmotion}
                onChange={(e) => setCurrentEmotion(e.target.value)}
                className="w-full px-4 py-3 text-center bg-white/70 border border-gray-200 rounded-full text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 backdrop-blur-md"
                style={{ fontFamily: 'Noto Sans KR, sans-serif' }}
              >
                <option value="joy">기쁨</option>
                <option value="sadness">슬픔</option>
                <option value="anger">분노</option>
                <option value="fear">두려움</option>
                <option value="anxiety">불안</option>
                <option value="love">사랑</option>
                <option value="gratitude">감사</option>
                <option value="loneliness">외로움</option>
                <option value="peace">평온</option>
                <option value="excitement">흥분</option>
                <option value="neutral">중립</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm text-gray-600 mb-3 font-medium" style={{ fontFamily: 'Noto Sans KR, sans-serif' }}>
                감정 강도: {Math.round(emotionIntensity * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={emotionIntensity}
                onChange={(e) => setEmotionIntensity(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="mb-8">
              <label className="block text-sm text-gray-600 mb-3 font-medium" style={{ fontFamily: 'Noto Sans KR, sans-serif' }}>
                배경 이미지 (명화 등)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full px-4 py-3 text-center bg-white/70 border border-gray-200 rounded-full text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 backdrop-blur-md"
                style={{ fontFamily: 'Noto Sans KR, sans-serif' }}
              />
            </div>
            
            <button 
              onClick={startExploration}
              className="bg-white/70 backdrop-blur-md hover:bg-white/80 text-gray-700 font-medium py-4 px-8 rounded-full text-xl shadow-lg transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:translate-y-0 border border-white/60"
              style={{ fontFamily: 'Noto Sans KR, sans-serif' }}
            >
              감정 탐험 시작하기
            </button>
          </div>
        </div>
      )}
      
      {phase === 'exploring' && (
        <div className={'absolute top-6 left-6 bg-white/60 backdrop-blur-md rounded-2xl p-5 shadow-xl transform transition-all duration-300 hover:scale-105 border border-white/40 ' + (transitioning ? 'opacity-0' : 'opacity-100')}>
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-white/50 rounded-full p-3">
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-light" style={{ fontFamily: 'Noto Sans KR, sans-serif' }}>탐험 시간</p>
              <p className="text-2xl font-normal text-gray-700" style={{ fontFamily: 'Noto Sans KR, sans-serif' }}>{formatTimer(secondsExploring)}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-white/50 rounded-full p-3">
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-light" style={{ fontFamily: 'Noto Sans KR, sans-serif' }}>현재 감정</p>
              <p className="text-xl font-normal text-gray-700" style={{ fontFamily: 'Noto Sans KR, sans-serif' }}>
                {currentEmotion === 'joy' ? '기쁨' :
                 currentEmotion === 'sadness' ? '슬픔' :
                 currentEmotion === 'anger' ? '분노' :
                 currentEmotion === 'fear' ? '두려움' :
                 currentEmotion === 'anxiety' ? '불안' :
                 currentEmotion === 'love' ? '사랑' :
                 currentEmotion === 'gratitude' ? '감사' :
                 currentEmotion === 'loneliness' ? '외로움' :
                 currentEmotion === 'peace' ? '평온' :
                 currentEmotion === 'excitement' ? '흥분' :
                 '중립'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-white/50 rounded-full p-3">
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-light" style={{ fontFamily: 'Noto Sans KR, sans-serif' }}>발견한 메시지</p>
              <p className="text-2xl font-normal text-gray-700" style={{ fontFamily: 'Noto Sans KR, sans-serif' }}>{foundMessages.length}</p>
            </div>
          </div>
          
          <button 
            onClick={finishExploration}
            className="w-full bg-white/60 backdrop-blur-md hover:bg-white/70 text-gray-700 font-medium py-3 px-6 rounded-xl shadow-md transform transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 border border-white/40"
            style={{ fontFamily: 'Noto Sans KR, sans-serif' }}
          >
            탐험 마치기
          </button>
        </div>
      )}
      
      {phase === 'results' && (
        <div className={'absolute inset-0 flex items-center justify-center backdrop-blur-sm transition-opacity duration-500 ' + (transitioning ? 'opacity-0' : 'opacity-100')}>
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all duration-500 border border-white/60">
            <h2 className="text-3xl font-light mb-6 text-gray-800 text-center" style={{ fontFamily: 'Dancing Script, cursive' }}>
              감정 여행의 기록
            </h2>
            
            <div className="flex justify-between mb-8 p-4 bg-white/30 rounded-xl">
              <div className="text-center flex-1">
                <p className="text-sm text-gray-600 uppercase tracking-wider font-light" style={{ fontFamily: 'Noto Sans KR, sans-serif' }}>탐험 시간</p>
                <p className="text-2xl font-normal text-gray-700 pl-4" style={{ fontFamily: 'Noto Sans KR, sans-serif' }}>{formatTimer(secondsExploring)}</p>
              </div>
              <div className="w-px bg-white/30"></div>
              <div className="text-center flex-1">
                <p className="text-sm text-gray-600 uppercase tracking-wider font-light" style={{ fontFamily: 'Noto Sans KR, sans-serif' }}>메시지</p>
                <p className="text-2xl font-normal text-gray-700 pr-4" style={{ fontFamily: 'Noto Sans KR, sans-serif' }}>{foundMessages.length}</p>
              </div>
            </div>
            
            <div className="mb-8">
              <h3 className="font-medium mb-4 text-gray-700 text-lg" style={{ fontFamily: 'Noto Sans KR, sans-serif' }}>발견한 공감 메시지</h3>
              <div className="max-h-64 overflow-y-auto bg-white/30 rounded-xl p-4 shadow-inner">
                {foundMessages.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 font-light" style={{ fontFamily: 'Noto Sans KR, sans-serif' }}>
                      아직 메시지를 찾지 못했어요.<br />
                      다시 한번 감정을 탐험해보세요.
                    </p>
                  </div>
                ) : (
                  foundMessages.map((message, index) => (
                    <div 
                      key={index} 
                      className="mb-2 p-3 rounded-lg backdrop-blur-sm shadow-sm transform transition-all duration-300 hover:scale-102 flex items-center justify-between bg-green-100/60 hover:bg-green-100/80"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-normal text-gray-700" style={{ fontFamily: 'Noto Sans KR, sans-serif' }}>
                          {message.text}
                        </span>
                      </div>
                      <span className="text-gray-500 text-sm ml-2 font-light" style={{ fontFamily: 'Noto Sans KR, sans-serif' }}>
                        {formatTimer(message.time)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <button 
              onClick={restartGame}
              className="w-full bg-white/60 backdrop-blur-md hover:bg-white/70 text-gray-700 font-medium py-3 px-6 rounded-full shadow-lg transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:translate-y-0 border border-white/60"
              style={{ fontFamily: 'Noto Sans KR, sans-serif' }}
            >
              새로운 감정 여행하기
            </button>
          </div>
        </div>
      )}
      
      {phase === 'exploring' && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center">
          <div className="bg-white/85 backdrop-blur-md px-6 py-3 rounded-full shadow-lg border border-white/60">
            <p className="text-gray-700 text-sm font-medium flex items-center gap-2" style={{ fontFamily: 'Noto Sans KR, sans-serif' }}>
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
              잔디를 클릭하여 감정 메시지를 발견하세요 🌱💝
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmotionCanvas;