'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import styles from './page.module.css';
import { DOCUMENT_CONTENT, DOCUMENT_CONTENT_DISABILITY, VOCABULARY_LIST } from './mockData';
import { schoolTest1, schoolTest2, schoolTest3, schoolTest4 } from './schoolTests';
import { disabilityTest1, disabilityTest2, disabilityTest3, disabilityTest4 } from './disabilityTests';
import { syntheticTest1 } from './syntheticTest';

interface MatchPair {
  term: string;
  definition: string;
}

interface Question {
  id: number;
  type: 'multiple_choice' | 'fill_blank' | 'true_false' | 'matching' | 'reading_comprehension' | 'word_formation';
  question: string;
  options: string[] | MatchPair[] | null;
  correctAnswer: string;
  explanation: string;
}

interface UserAnswer {
  questionId: number;
  answer: string;
  matchingAnswers?: Record<string, string>;
}

type TestState = 'home' | 'loading' | 'test' | 'results' | 'docs' | 'vocab';

const TOTAL_TIME = 30 * 60; // 30 minutes in seconds

export default function Home() {
  const [testState, setTestState] = useState<TestState>('home');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [score, setScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState('');
  const [matchingSelections, setMatchingSelections] = useState<Record<string, string>>({});
  const [fillBlankInput, setFillBlankInput] = useState('');
  const [wordFormInput, setWordFormInput] = useState('');
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const [vocabIndex, setVocabIndex] = useState(0);
  const [showVocabMeaning, setShowVocabMeaning] = useState(false);
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [translation, setTranslation] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const [activeDoc, setActiveDoc] = useState<'school'|'disability'>('school');
  const [vocabMode, setVocabMode] = useState<'normal' | 'random'>('normal');
  const [vocabSequence, setVocabSequence] = useState<number[]>(() => Array.from({length: VOCABULARY_LIST.length}, (_, i) => i));
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer
  useEffect(() => {
    if (testState === 'test' && timeLeft > 0 && !testSubmitted) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testState, testSubmitted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeLeft <= 60) return '#ef4444';
    if (timeLeft <= 300) return '#f59e0b';
    return '#10b981';
  };

  const startTest = async (testId: string) => {
    setTestState('loading');
    setError('');
    setLoadingProgress(0);
    
    const messages = [
      '🔍 Đang lật tìm trang sách cổ...',
      '🍄 Đang thu thập kiến thức mộc mạc...',
      '📜 Đang chép tay bài kiểm tra...',
      '🌿 Đang ươm mầm câu hỏi...',
      '🍂 Sắp hoàn tất! Đợi chiếc lá cuối cùng rơi...',
    ];

    let msgIndex = 0;
    setLoadingMessage(messages[0]);
    
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        const newVal = Math.min(prev + Math.random() * 8, 90);
        const newMsgIndex = Math.min(Math.floor(newVal / 20), messages.length - 1);
        if (newMsgIndex !== msgIndex) {
          msgIndex = newMsgIndex;
          setLoadingMessage(messages[msgIndex]);
        }
        return newVal;
      });
    }, 300);

    try {
      // Simulate API delay instead of calling it
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      clearInterval(progressInterval);

      const testMapping: Record<string, any> = {
        'school-1': schoolTest1,
        'school-2': schoolTest2,
        'school-3': schoolTest3,
        'school-4': schoolTest4,
        'disability-1': disabilityTest1,
        'disability-2': disabilityTest2,
        'disability-3': disabilityTest3,
        'disability-4': disabilityTest4,
        'synthetic-1': syntheticTest1
      };
      
      const data = { questions: testMapping[testId] };
      
      if (!data.questions || data.questions.length === 0) {
        throw new Error('No questions were generated');
      }

      setLoadingProgress(100);
      setLoadingMessage('✅ Hoàn tất! Bắt đầu bài kiểm tra...');
      
      setTimeout(() => {
        setQuestions(data.questions as Question[]);
        setAnswers([]);
        setCurrentQuestion(0);
        setTimeLeft(TOTAL_TIME);
        setScore(0);
        setTestSubmitted(false);
        setAnsweredQuestions(new Set());
        setMatchingSelections({});
        setFillBlankInput('');
        setWordFormInput('');
        setTestState('test');
      }, 800);

    } catch (err) {
      clearInterval(progressInterval);
      setError(String(err));
      setTestState('home');
    }
  };

  const handleAnswer = (answer: string) => {
    const q = questions[currentQuestion];
    const existing = answers.find(a => a.questionId === q.id);
    
    if (existing) {
      setAnswers(prev => prev.map(a => a.questionId === q.id ? { ...a, answer } : a));
    } else {
      setAnswers(prev => [...prev, { questionId: q.id, answer }]);
    }
    
    setAnsweredQuestions(prev => new Set([...prev, currentQuestion]));
  };

  const handleMatchingAnswer = () => {
    const q = questions[currentQuestion];
    const existing = answers.find(a => a.questionId === q.id);
    
    if (existing) {
      setAnswers(prev => prev.map(a => 
        a.questionId === q.id 
          ? { ...a, answer: 'matched', matchingAnswers: { ...matchingSelections } } 
          : a
      ));
    } else {
      setAnswers(prev => [...prev, { 
        questionId: q.id, 
        answer: 'matched', 
        matchingAnswers: { ...matchingSelections } 
      }]);
    }
    
    setAnsweredQuestions(prev => new Set([...prev, currentQuestion]));
  };

  const handleFillBlankSubmit = () => {
    if (fillBlankInput.trim()) {
      handleAnswer(fillBlankInput.trim());
      setFillBlankInput('');
    }
  };

  const handleWordFormSubmit = () => {
    if (wordFormInput.trim()) {
      handleAnswer(wordFormInput.trim());
      setWordFormInput('');
    }
  };

  const navigateQuestion = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    } else if (direction === 'next' && currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
    setMatchingSelections({});
    setShowExplanation(false);
  };

  const jumpToQuestion = (index: number) => {
    setCurrentQuestion(index);
    setMatchingSelections({});
    setShowExplanation(false);
  };

  const calculateScore = useCallback(() => {
    let correct = 0;
    
    for (const answer of answers) {
      const question = questions.find(q => q.id === answer.questionId);
      if (!question) continue;

      if (question.type === 'matching') {
        if (answer.matchingAnswers) {
          const matchOptions = question.options as MatchPair[];
          let allCorrect = true;
          for (const pair of matchOptions) {
            if (answer.matchingAnswers[pair.term] !== pair.definition) {
              allCorrect = false;
              break;
            }
          }
          if (allCorrect) correct++;
        }
      } else if (question.type === 'fill_blank' || question.type === 'word_formation') {
        if (answer.answer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()) {
          correct++;
        }
      } else {
        if (answer.answer === question.correctAnswer) {
          correct++;
        }
      }
    }
    
    return correct;
  }, [answers, questions]);

  const handleSubmitTest = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const finalScore = calculateScore();
    setScore(finalScore);
    setTestSubmitted(true);
    setTestState('results');
  }, [calculateScore]);

  const getQuestionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      multiple_choice: 'Trắc nghiệm',
      fill_blank: 'Điền từ',
      true_false: 'Đúng/Sai',
      matching: 'Nối cột',
      reading_comprehension: 'Đọc hiểu',
      word_formation: 'Tạo từ',
    };
    return labels[type] || type;
  };

  const getQuestionTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      multiple_choice: '📋',
      fill_blank: '✏️',
      true_false: '✅',
      matching: '🔗',
      reading_comprehension: '📖',
      word_formation: '🔤',
    };
    return icons[type] || '❓';
  };

  const getQuestionTypeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      multiple_choice: 'badge-info',
      fill_blank: 'badge-warning',
      true_false: 'badge-success',
      matching: 'badge-error',
      reading_comprehension: 'badge-info',
      word_formation: 'badge-warning',
    };
    return colors[type] || 'badge-info';
  };

  const isQuestionCorrect = (questionId: number) => {
    const answer = answers.find(a => a.questionId === questionId);
    const question = questions.find(q => q.id === questionId);
    if (!answer || !question) return false;

    if (question.type === 'matching') {
      if (!answer.matchingAnswers) return false;
      const matchOptions = question.options as MatchPair[];
      return matchOptions.every(pair => answer.matchingAnswers?.[pair.term] === pair.definition);
    } else if (question.type === 'fill_blank' || question.type === 'word_formation') {
      return answer.answer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
    }
    return answer.answer === question.correctAnswer;
  };

  const getCurrentAnswer = () => {
    const q = questions[currentQuestion];
    return answers.find(a => a.questionId === q?.id);
  };

  // ===================== TAP-TO-TRANSLATE FUNCTIONS =====================
  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection) return;
    
    const text = selection.toString().trim();
    if (text.length > 0) {
      // Highlighted a whole phrase
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      setTooltipPos({ 
        top: rect.bottom + 10, 
        left: rect.left + rect.width / 2 
      });
      
      setSelectedWord(text);
      setTranslation(null);
      setIsTranslating(true);

      fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(text)}`)
        .then(res => res.json())
        .then(data => {
          if (data && data[0] && data[0][0] && data[0][0][0]) {
            setTranslation(data[0][0][0]);
          } else {
            setTranslation('N/A');
          }
        })
        .catch(() => setTranslation('Lỗi kết nối'))
        .finally(() => setIsTranslating(false));
    }
  }, []);

  const handleWordClick = async (e: React.MouseEvent<HTMLSpanElement>, word: string) => {
    e.stopPropagation();
    
    // If user is selecting a phrase, don't trigger single word translation
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      return;
    }

    const cleanWord = word.replace(/[^a-zA-Z-]/g, '').toLowerCase();
    if (!cleanWord) return;

    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setTooltipPos({ 
      top: rect.bottom + 10, 
      left: rect.left + rect.width / 2 
    });
    
    setSelectedWord(cleanWord);
    setTranslation(null);
    setIsTranslating(true);

    try {
      const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(cleanWord)}`);
      const data = await res.json();
      if (data && data[0] && data[0][0] && data[0][0][0]) {
        setTranslation(data[0][0][0]);
      } else {
        setTranslation('N/A');
      }
    } catch (err) {
      setTranslation('Lỗi kết nối');
    } finally {
      setIsTranslating(false);
    }
  };

  const renderInteractiveDocument = (content: string) => {
    const paragraphs = content.split('\n');
    return (
      <div 
        className={styles.documentInteractive} 
        style={{ 
          fontSize: '17px', 
          lineHeight: '28px', // Syncs exactly with background grid size
          color: '#273444', // Deep ink color
          position: 'relative', 
          cursor: 'text',
          backgroundColor: '#fdf8ec', // Warm vintage paper tone
          backgroundImage: 'linear-gradient(#e5d8c1 1px, transparent 1px), linear-gradient(90deg, #e5d8c1 1px, transparent 1px)',
          backgroundSize: '28px 28px', // 28x28 grid paper (giấy ô ly)
          backgroundPosition: '0 0',
          padding: '28px 40px', // Aligns inner padding with grid lines
          fontFamily: '"Georgia", "Times New Roman", serif',
          boxShadow: 'inset 0 0 80px rgba(160, 130, 90, 0.15), 0 4px 6px rgba(0,0,0,0.05)', // Classic vignette edge shadow
          borderRadius: '4px',
          border: '1px solid #d4c4a8',
          minHeight: '600px'
        }}
        onClick={(e) => {
          const selection = window.getSelection();
          if (!selection || selection.toString().trim().length === 0) {
            setSelectedWord(null);
          }
        }}
        onMouseUp={handleTextSelection}
        onTouchEnd={handleTextSelection}
      >
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spinTranslate {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}} />
        
        {paragraphs.map((para, pIdx) => {
          if (!para.trim()) return <br key={pIdx} />;
          
          let rawPara = para.trim();
          let isHeading = false;
          let isQuote = false;
          let isItalic = false;
          let isCenter = false;

          if (rawPara.startsWith('### ')) {
            isHeading = true;
            para = para.replace('### ', '');
            rawPara = rawPara.replace('### ', '');
          }
          if (rawPara.startsWith('>>> ')) {
            isQuote = true;
            para = para.replace('>>> ', '');
            rawPara = rawPara.replace('>>> ', '');
          }
          if (rawPara.includes('___ ')) {
            isItalic = true;
            para = para.replace('___ ', '');
            rawPara = rawPara.replace('___ ', '');
          }
          if (rawPara.startsWith('[C] ')) {
            isCenter = true;
            para = para.replace('[C] ', '');
            rawPara = rawPara.replace('[C] ', '');
          }

          const isBullet = rawPara.startsWith('-') || rawPara.startsWith('•') || rawPara.startsWith('*');
          const isNumbered = /^[0-9]+[\.\)]\s/.test(rawPara);
          const isList = isBullet || isNumbered;

          return (
            <p key={pIdx} style={{ 
              marginBottom: isList ? '10px' : '28px', 
              textAlign: isHeading || isList ? 'left' : (isQuote || isCenter ? 'center' : 'justify'), 
              textIndent: '0',
              paddingLeft: isList ? '40px' : '0',
              fontWeight: isHeading ? 'bold' : 'normal',
              fontSize: isHeading ? '1.2em' : '1em',
              color: isHeading ? '#1e293b' : 'inherit',
              fontStyle: isQuote || isItalic ? 'italic' : 'normal',
            }}>
              {isQuote ? (
                <span style={{ backgroundColor: '#fef08a', padding: '4px 8px', borderRadius: '2px', fontWeight: 'bold' }}>
                  {para.split(' ').map((word, wIdx) => {
                    if (!word) return null;
                    const cleanWord = word.replace(/[^a-zA-Z-]/g, '').toLowerCase();
                    const isSelected = selectedWord === cleanWord && cleanWord !== '';
                    return (
                      <span 
                        key={wIdx} 
                        onClick={(e) => handleWordClick(e, word)}
                        data-selected={isSelected ? "true" : undefined}
                        style={{
                          cursor: 'pointer',
                          transition: 'background-color 0.2s ease',
                          backgroundColor: isSelected ? 'rgba(234, 179, 8, 0.4)' : 'transparent',
                          borderBottom: isSelected ? '2px solid #ca8a04' : 'none'
                        }}
                      >
                        {word}{' '}
                      </span>
                    );
                  })}
                </span>
              ) : (
                para.split(' ').map((word, wIdx) => {
                  if (!word) return null;
                  const cleanWord = word.replace(/[^a-zA-Z-]/g, '').toLowerCase();
                const isSelected = selectedWord === cleanWord && cleanWord !== '';
                return (
                  <span 
                    key={wIdx} 
                    onClick={(e) => handleWordClick(e, word)}
                    data-selected={isSelected ? "true" : undefined}
                    style={{
                      cursor: 'pointer',
                      borderRadius: '3px',
                      transition: 'background-color 0.2s ease',
                      backgroundColor: isSelected ? 'rgba(234, 179, 8, 0.4)' : 'transparent',
                      borderBottom: isSelected ? '2px solid #ca8a04' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(100, 116, 139, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {word}
                  </span>
                );
              }).reduce((prev, curr) => curr !== null ? (prev === null ? [curr] : [prev, ' ', curr]) : prev, null as any))}
            </p>
          );
        })}

        {/* Global Tooltip Portal within the Document container */}
        {selectedWord && (
          <div 
            style={{
              position: 'fixed',
              top: `${tooltipPos.top}px`,
              left: `${tooltipPos.left}px`,
              transform: 'translate(-50%, 0)',
              backgroundColor: '#0f172a',
              color: '#f8fafc',
              padding: '10px 16px',
              borderRadius: '10px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
              zIndex: 99999,
              fontSize: '15px',
              minWidth: '120px',
              textAlign: 'center',
              pointerEvents: 'none'
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>{selectedWord}</div>
            {isTranslating ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
                 <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spinTranslate 1s linear infinite' }}></span>
              </div>
            ) : (
              <div style={{ color: '#10b981', fontWeight: 600, fontSize: '16px' }}>{translation}</div>
            )}
            <div style={{
              position: 'absolute',
              top: '-6px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '0',
              height: '0',
              borderLeft: '7px solid transparent',
              borderRight: '7px solid transparent',
              borderBottom: '7px solid #0f172a'
            }}></div>
          </div>
        )}
      </div>
    );
  };

  // ===================== RENDER FUNCTIONS =====================
  const renderHome = () => (
    <div className={styles.homeContainer}>
      <div className={styles.heroSection}>
        <div className={styles.heroGlow} />
        <div className={styles.heroContent}>
          <div className={styles.heroIcon}>🍄</div>
          <h1 className={styles.heroTitle}>
            Social Work
            <span className={styles.heroTitleAccent}> English Test</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Bài kiểm tra tiếng Anh chuyên ngành Công tác xã hội
          </p>
          
          <div className={styles.featureGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>⏳</div>
              <div className={styles.featureTitle}>30 Phút</div>
              <div className={styles.featureDesc}>Thời gian làm bài</div>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>📜</div>
              <div className={styles.featureTitle}>30 Câu</div>
              <div className={styles.featureDesc}>Đa dạng dạng bài</div>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🌿</div>
              <div className={styles.featureTitle}>Mộc Mạc</div>
              <div className={styles.featureDesc}>Học tập tự nhiên</div>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🍁</div>
              <div className={styles.featureTitle}>Đánh giá</div>
              <div className={styles.featureDesc}>Kết quả chi tiết</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', margin: '30px 0' }}>
            
            <div style={{ background: 'var(--bg-tertiary)', borderRadius: '16px', padding: '24px', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <span style={{ fontSize: '32px' }}>🛖</span>
                <h3 style={{ margin: 0, color: 'var(--primary-dark)', fontSize: '20px' }}>School Social Work</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button className="btn-secondary" onClick={() => startTest('school-1')} style={{ padding: '12px 0', fontSize: '15px' }}>Đề 1 (30 câu)</button>
                <button className="btn-secondary" onClick={() => startTest('school-2')} style={{ padding: '12px 0', fontSize: '15px' }}>Đề 2 (30 câu)</button>
                <button className="btn-secondary" onClick={() => startTest('school-3')} style={{ padding: '12px 0', fontSize: '15px' }}>Đề 3 (30 câu)</button>
                <button className="btn-secondary" onClick={() => startTest('school-4')} style={{ padding: '12px 0', fontSize: '15px' }}>Đề 4 (30 câu)</button>
              </div>
            </div>

            <div style={{ background: 'var(--bg-tertiary)', borderRadius: '16px', padding: '24px', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <span style={{ fontSize: '32px' }}>🌾</span>
                <h3 style={{ margin: 0, color: 'var(--primary-dark)', fontSize: '20px' }}>Disability Practice</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button className="btn-secondary" onClick={() => startTest('disability-1')} style={{ padding: '12px 0', fontSize: '15px' }}>Đề 1 (30 câu)</button>
                <button className="btn-secondary" onClick={() => startTest('disability-2')} style={{ padding: '12px 0', fontSize: '15px' }}>Đề 2 (30 câu)</button>
                <button className="btn-secondary" onClick={() => startTest('disability-3')} style={{ padding: '12px 0', fontSize: '15px' }}>Đề 3 (30 câu)</button>
                <button className="btn-secondary" onClick={() => startTest('disability-4')} style={{ padding: '12px 0', fontSize: '15px' }}>Đề 4 (30 câu)</button>
              </div>
            </div>

            <div style={{ background: 'var(--bg-tertiary)', borderRadius: '16px', padding: '24px', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <span style={{ fontSize: '32px' }}>🔮</span>
                <h3 style={{ margin: 0, color: 'var(--accent-secondary)', fontSize: '20px' }}>Bài Thi Tổng Hợp</h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>Kết hợp nội dung từ cả 2 tài liệu để đánh giá kiến thức toàn diện.</p>
              <button className="btn-primary" onClick={() => startTest('synthetic-1')} style={{ width: '100%', padding: '14px 0', fontSize: '16px', fontWeight: 'bold' }}>Bắt Đầu Thi (30 Câu)</button>
            </div>
            
          </div>

          <div className={styles.questionTypes}>
            <h3 className={styles.sectionTitle}>Các dạng câu hỏi</h3>
            <div className={styles.typesList}>
              <span className={`badge badge-info`}>📋 Trắc nghiệm</span>
              <span className={`badge badge-success`}>✅ Đúng/Sai</span>
              <span className={`badge badge-error`}>🔗 Nối cột</span>
              <span className={`badge badge-info`}>📖 Đọc hiểu</span>
              <span className={`badge badge-warning`}>🔤 Tạo từ</span>
            </div>
          </div>

          {error && (
            <div className={styles.errorBox}>
              <span>⚠️</span>
              <p>{error}</p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '16px', marginTop: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-secondary" onClick={() => setTestState('docs')} style={{ fontSize: '16px', padding: '16px 36px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-light)' }}>
              📄 Xem Tài liệu
            </button>
            <button className="btn-secondary" onClick={() => { 
              setTestState('vocab'); 
              setVocabIndex(0); 
              setShowVocabMeaning(false); 
              setVocabMode('normal');
              setVocabSequence(Array.from({length: VOCABULARY_LIST.length}, (_, i) => i));
            }} style={{ fontSize: '16px', padding: '16px 36px', backgroundColor: 'var(--bg-card)', color: 'var(--accent-primary)', border: '1px solid var(--border-light)', fontWeight: 600 }}>
              📚 Ôn Từ Vựng
            </button>

          </div>
        </div>
      </div>
    </div>
  );

  const renderLoading = () => (
    <div className={styles.loadingContainer}>
      <div className={styles.loadingCard}>
        <div className={styles.loadingSpinner}>
          <div className={styles.spinnerRing} />
          <div className={styles.spinnerIcon}>🍄</div>
        </div>
        <h2 className={styles.loadingTitle}>Đang tạo bài kiểm tra...</h2>
        <p className={styles.loadingMessage}>{loadingMessage}</p>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${loadingProgress}%` }} />
        </div>
        <span className={styles.progressText}>{Math.round(loadingProgress)}%</span>
      </div>
    </div>
  );

  const renderQuestion = () => {
    if (questions.length === 0) return null;
    const q = questions[currentQuestion];
    const currentAnswer = getCurrentAnswer();

    return (
      <div className={styles.testContainer}>
        {/* Header */}
        <div className={styles.testHeader}>
          <div className={styles.testHeaderLeft}>
            <h2 className={styles.testTitle}>📝 Social Work English Test</h2>
            <div className={styles.questionProgress}>
              Câu {currentQuestion + 1}/{questions.length} • 
              Đã làm: {answeredQuestions.size}/{questions.length}
            </div>
          </div>
          <div className={styles.testHeaderRight}>
            <div className={styles.timer} style={{ color: getTimeColor(), borderColor: getTimeColor() }}>
              <span className={styles.timerIcon}>⏱️</span>
              <span className={styles.timerText}>{formatTime(timeLeft)}</span>
            </div>
            <button 
              className="btn-primary" 
              onClick={() => {
                if (confirm('Bạn có chắc muốn nộp bài? Các câu chưa trả lời sẽ được tính là sai.')) {
                  handleSubmitTest();
                }
              }}
              id="submit-test-btn"
              style={{ padding: '10px 20px', fontSize: '14px' }}
            >
              📤 Nộp bài
            </button>
          </div>
        </div>

        <div className={styles.testBody}>
          {/* Question Navigation */}
          <div className={styles.questionNav}>
            <h4 className={styles.navTitle}>Danh sách câu hỏi</h4>
            <div className={styles.navGrid}>
              {questions.map((_, idx) => (
                <button
                  key={idx}
                  className={`${styles.navBtn} ${idx === currentQuestion ? styles.navBtnActive : ''} ${answeredQuestions.has(idx) ? styles.navBtnAnswered : ''}`}
                  onClick={() => jumpToQuestion(idx)}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
            <div className={styles.navLegend}>
              <div className={styles.legendItem}>
                <div className={`${styles.legendDot} ${styles.legendActive}`} />
                <span>Đang xem</span>
              </div>
              <div className={styles.legendItem}>
                <div className={`${styles.legendDot} ${styles.legendAnswered}`} />
                <span>Đã trả lời</span>
              </div>
              <div className={styles.legendItem}>
                <div className={`${styles.legendDot} ${styles.legendUnanswered}`} />
                <span>Chưa làm</span>
              </div>
            </div>
          </div>

          {/* Question Content */}
          <div className={styles.questionPanel}>
            <div className={styles.questionHeader}>
              <span className={`badge ${getQuestionTypeBadgeColor(q.type)}`}>
                {getQuestionTypeIcon(q.type)} {getQuestionTypeLabel(q.type)}
              </span>
              <span className={styles.questionNumber}>Câu {currentQuestion + 1}</span>
            </div>

            <div className={styles.questionText}>
              {q.question}
            </div>

            {/* Multiple Choice / Reading Comprehension */}
            {(q.type === 'multiple_choice' || q.type === 'reading_comprehension') && q.options && (
              <div className={styles.optionsList}>
                {(q.options as string[]).map((opt, idx) => (
                  <button
                    key={idx}
                    className={`${styles.optionBtn} ${currentAnswer?.answer === opt ? styles.optionSelected : ''}`}
                    onClick={() => handleAnswer(opt)}
                    id={`option-${idx}`}
                  >
                    <span className={styles.optionLetter}>{String.fromCharCode(65 + idx)}</span>
                    <span className={styles.optionText}>{opt.replace(/^[A-D]\.\s*/, '')}</span>
                  </button>
                ))}
              </div>
            )}

            {/* True/False */}
            {q.type === 'true_false' && (
              <div className={styles.trueFalseContainer}>
                <button
                  className={`${styles.tfBtn} ${styles.tfTrue} ${currentAnswer?.answer === 'True' ? styles.tfSelected : ''}`}
                  onClick={() => handleAnswer('True')}
                  id="true-btn"
                >
                  ✅ True
                </button>
                <button
                  className={`${styles.tfBtn} ${styles.tfFalse} ${currentAnswer?.answer === 'False' ? styles.tfSelected : ''}`}
                  onClick={() => handleAnswer('False')}
                  id="false-btn"
                >
                  ❌ False
                </button>
              </div>
            )}

            {/* Fill in the Blank */}
            {q.type === 'fill_blank' && (
              <div className={styles.fillBlankContainer}>
                <input
                  type="text"
                  className={styles.fillInput}
                  placeholder="Nhập từ cần điền..."
                  value={currentAnswer?.answer || fillBlankInput}
                  onChange={(e) => {
                    setFillBlankInput(e.target.value);
                    if (currentAnswer) {
                      handleAnswer(e.target.value);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleFillBlankSubmit();
                  }}
                  id="fill-blank-input"
                />
                {!currentAnswer && (
                  <button className="btn-primary" onClick={handleFillBlankSubmit} style={{ padding: '10px 20px' }}>
                    Xác nhận
                  </button>
                )}
              </div>
            )}

            {/* Word Formation */}
            {q.type === 'word_formation' && (
              <div className={styles.fillBlankContainer}>
                <input
                  type="text"
                  className={styles.fillInput}
                  placeholder="Nhập dạng từ đúng..."
                  value={currentAnswer?.answer || wordFormInput}
                  onChange={(e) => {
                    setWordFormInput(e.target.value);
                    if (currentAnswer) {
                      handleAnswer(e.target.value);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleWordFormSubmit();
                  }}
                  id="word-form-input"
                />
                {!currentAnswer && (
                  <button className="btn-primary" onClick={handleWordFormSubmit} style={{ padding: '10px 20px' }}>
                    Xác nhận
                  </button>
                )}
              </div>
            )}

            {/* Matching */}
            {q.type === 'matching' && q.options && (
              <div className={styles.matchingContainer}>
                <div className={styles.matchingGrid}>
                  <div className={styles.matchingColumn}>
                    <h4 className={styles.matchingHeader}>Thuật ngữ</h4>
                    {(q.options as MatchPair[]).map((pair, idx) => (
                      <div key={idx} className={styles.matchingTerm}>
                        <span className={styles.matchingNumber}>{idx + 1}</span>
                        {pair.term}
                      </div>
                    ))}
                  </div>
                  <div className={styles.matchingColumn}>
                    <h4 className={styles.matchingHeader}>Định nghĩa</h4>
                    {(q.options as MatchPair[]).map((pair, idx) => {
                      const isSelected = Object.values(matchingSelections).includes(pair.definition);
                      return (
                        <div key={idx} className={`${styles.matchingDef} ${isSelected ? styles.matchingDefSelected : ''}`}>
                          <span className={styles.matchingLetter}>{String.fromCharCode(65 + idx)}</span>
                          {pair.definition}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className={styles.matchingInputs}>
                  <p className={styles.matchingInstruction}>Nhập chữ cái tương ứng cho mỗi thuật ngữ:</p>
                  {(q.options as MatchPair[]).map((pair, idx) => (
                    <div key={idx} className={styles.matchingRow}>
                      <span>{idx + 1}. {pair.term} → </span>
                      <select
                        className={styles.matchingSelect}
                        value={matchingSelections[pair.term] || ''}
                        onChange={(e) => {
                          setMatchingSelections(prev => ({ ...prev, [pair.term]: e.target.value }));
                        }}
                      >
                        <option value="">Chọn...</option>
                        {(q.options as MatchPair[]).map((p, i) => (
                          <option key={i} value={p.definition}>{String.fromCharCode(65 + i)}. {p.definition.substring(0, 40)}...</option>
                        ))}
                      </select>
                    </div>
                  ))}
                  <button className="btn-primary" onClick={handleMatchingAnswer} style={{ marginTop: '12px', padding: '10px 24px' }}>
                    Xác nhận nối
                  </button>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className={styles.questionFooter}>
              <button 
                className="btn-secondary" 
                onClick={() => navigateQuestion('prev')}
                disabled={currentQuestion === 0}
              >
                ← Câu trước
              </button>
              <div className={styles.questionDots}>
                {currentQuestion + 1} / {questions.length}
              </div>
              <button 
                className="btn-secondary" 
                onClick={() => navigateQuestion('next')}
                disabled={currentQuestion === questions.length - 1}
              >
                Câu sau →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderResults = () => {
    const percentage = Math.round((score / questions.length) * 100);
    const timeSpent = TOTAL_TIME - timeLeft;
    
    let grade = '';
    let gradeColor = '';
    let gradeIcon = '';
    if (percentage >= 90) { grade = 'Xuất sắc'; gradeColor = '#10b981'; gradeIcon = '🏆'; }
    else if (percentage >= 80) { grade = 'Giỏi'; gradeColor = '#3b82f6'; gradeIcon = '🌟'; }
    else if (percentage >= 70) { grade = 'Khá'; gradeColor = '#8b5cf6'; gradeIcon = '👍'; }
    else if (percentage >= 60) { grade = 'Trung bình'; gradeColor = '#f59e0b'; gradeIcon = '📝'; }
    else { grade = 'Cần cải thiện'; gradeColor = '#ef4444'; gradeIcon = '💪'; }

    return (
      <div className={styles.resultsContainer}>
        <div className={styles.resultsHeader}>
          <div className={styles.resultsHero}>
            <div className={styles.gradeIcon}>{gradeIcon}</div>
            <h1 className={styles.resultsTitle}>Kết quả kiểm tra</h1>
            <div className={styles.scoreCircle} style={{ borderColor: gradeColor }}>
              <span className={styles.scoreNumber} style={{ color: gradeColor }}>{percentage}%</span>
              <span className={styles.scoreLabel}>{score}/{questions.length} câu đúng</span>
            </div>
            <div className={styles.gradeText} style={{ color: gradeColor }}>
              {grade}
            </div>
          </div>

          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>✅</div>
              <div className={styles.statValue}>{score}</div>
              <div className={styles.statLabel}>Câu đúng</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>❌</div>
              <div className={styles.statValue}>{questions.length - score}</div>
              <div className={styles.statLabel}>Câu sai</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>⏱️</div>
              <div className={styles.statValue}>{formatTime(timeSpent)}</div>
              <div className={styles.statLabel}>Thời gian</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>📝</div>
              <div className={styles.statValue}>{answeredQuestions.size}</div>
              <div className={styles.statLabel}>Đã trả lời</div>
            </div>
          </div>

          <div className={styles.resultsActions}>
            <button className="btn-primary" onClick={() => { setTestState('home'); setError(''); }} id="retry-btn">
              🔄 Làm bài mới
            </button>
          </div>
        </div>

        {/* Detailed Results */}
        <div className={styles.detailedResults}>
          <h2 className={styles.detailsTitle}>📋 Chi tiết từng câu</h2>
          {questions.map((q, idx) => {
            const answer = answers.find(a => a.questionId === q.id);
            const correct = isQuestionCorrect(q.id);
            
            return (
              <div key={q.id} className={`${styles.resultCard} ${correct ? styles.resultCorrect : styles.resultWrong}`}>
                <div className={styles.resultHeader}>
                  <div className={styles.resultLeft}>
                    <span className={correct ? styles.resultIconCorrect : styles.resultIconWrong}>
                      {correct ? '✅' : '❌'}
                    </span>
                    <span className={styles.resultQNum}>Câu {idx + 1}</span>
                    <span className={`badge ${getQuestionTypeBadgeColor(q.type)}`} style={{ fontSize: '11px' }}>
                      {getQuestionTypeLabel(q.type)}
                    </span>
                  </div>
                </div>
                <p className={styles.resultQuestion}>{q.question}</p>
                <div className={styles.resultAnswers}>
                  <div className={styles.resultAnswer}>
                    <span className={styles.answerLabel}>Câu trả lời:</span>
                    <span className={correct ? styles.answerCorrect : styles.answerWrong}>
                      {answer?.answer || 'Không trả lời'}
                    </span>
                  </div>
                  {!correct && (
                    <div className={styles.resultAnswer}>
                      <span className={styles.answerLabel}>Đáp án đúng:</span>
                      <span className={styles.answerCorrect}>{q.correctAnswer}</span>
                    </div>
                  )}
                </div>
                <div className={styles.resultExplanation}>
                  💡 {q.explanation}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDocs = () => (
    <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', padding: '20px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#334155' }}>Chi tiết Tài liệu</h2>
        
        <div style={{ display: 'flex', gap: '8px', backgroundColor: '#e2e8f0', padding: '4px', borderRadius: '8px' }}>
          <button 
            onClick={() => setActiveDoc('school')}
            style={{ 
              padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
              backgroundColor: activeDoc === 'school' ? '#ffffff' : 'transparent',
              color: activeDoc === 'school' ? '#0369a1' : '#64748b',
              boxShadow: activeDoc === 'school' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              border: 'none',
              transition: 'all 0.2s ease'
            }}
          >
            🏫 School Social Work
          </button>
          <button 
            onClick={() => setActiveDoc('disability')}
            style={{ 
              padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
              backgroundColor: activeDoc === 'disability' ? '#ffffff' : 'transparent',
              color: activeDoc === 'disability' ? '#0369a1' : '#64748b',
              boxShadow: activeDoc === 'disability' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              border: 'none',
              transition: 'all 0.2s ease'
            }}
          >
            ♿ Disability Practice
          </button>
        </div>

        <button 
          onClick={() => setTestState('home')}
          className="btn-secondary"
          style={{ cursor: 'pointer', padding: '8px 16px', fontSize: '15px' }}
        >
          🔙 Quay lại
        </button>
      </div>
      <div style={{ padding: '30px', backgroundColor: '#e2e8f0', backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '10px 10px', borderRadius: '12px' }}>
        {renderInteractiveDocument(activeDoc === 'school' ? DOCUMENT_CONTENT : DOCUMENT_CONTENT_DISABILITY)}
      </div>
    </div>
  );

  const renderVocab = () => {
    const activeIndex = vocabSequence[vocabIndex] !== undefined ? vocabSequence[vocabIndex] : 0;
    const currentWord = VOCABULARY_LIST[activeIndex];

    return (
    <div style={{ width: '100%', maxWidth: '700px', margin: '0 auto', padding: '20px 0', minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--accent-primary)' }}>📚 Ôn Tập Từ Vựng Dễ Sai</h2>
        <button 
          onClick={() => setTestState('home')}
          className="btn-secondary"
          style={{ cursor: 'pointer', padding: '8px 16px', fontSize: '15px' }}
        >
          🔙 Quay lại
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '20px' }}>
        <button 
          onClick={() => {
            if(vocabMode === 'normal') return;
            setVocabMode('normal');
            setVocabSequence(Array.from({length: VOCABULARY_LIST.length}, (_, i) => i));
            setVocabIndex(0);
            setShowVocabMeaning(false);
          }}
          style={{ padding: '8px 24px', borderRadius: '20px', cursor: 'pointer', fontWeight: 600, transition: '0.2s', backgroundColor: vocabMode === 'normal' ? '#10b981' : 'transparent', color: vocabMode === 'normal' ? '#fff' : '#64748b', border: vocabMode === 'normal' ? '1px solid #10b981' : '1px solid #cbd5e1' }}
        >
          📖 Trình tự gốc
        </button>
        <button 
          onClick={() => {
            if(vocabMode === 'random') return;
            setVocabMode('random');
            const seq = Array.from({length: VOCABULARY_LIST.length}, (_, i) => i).sort(() => Math.random() - 0.5);
            setVocabSequence(seq);
            setVocabIndex(0);
            setShowVocabMeaning(false);
          }}
          style={{ padding: '8px 24px', borderRadius: '20px', cursor: 'pointer', fontWeight: 600, transition: '0.2s', backgroundColor: vocabMode === 'random' ? '#8b5cf6' : 'transparent', color: vocabMode === 'random' ? '#fff' : '#64748b', border: vocabMode === 'random' ? '1px solid #8b5cf6' : '1px solid #cbd5e1' }}
        >
          🔀 Ngẫu nhiên
        </button>
      </div>
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ padding: '8px 16px', borderRadius: '20px', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-light)', fontWeight: 'bold', marginBottom: '20px', fontSize: '15px' }}>
          Từ {vocabIndex + 1} / {VOCABULARY_LIST.length} {vocabMode === 'random' ? '(Trộn)' : ''}
        </div>

        {/* Flashcard Area */}
        <div 
          style={{
            width: '100%',
            minHeight: '320px',
            backgroundColor: '#ffffff',
            border: '2px solid var(--border-light)',
            borderRadius: '16px',
            padding: '40px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease',
            position: 'relative'
          }}
          onClick={() => setShowVocabMeaning(!showVocabMeaning)}
        >
          {!showVocabMeaning ? (
             <div style={{ textAlign: 'center' }}>
               <span style={{ fontSize: '16px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>{currentWord.pos}</span>
               
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', margin: '20px 0' }}>
                 <h3 style={{ fontSize: '42px', margin: 0, color: 'var(--text-primary)' }}>{currentWord.word}</h3>
                 <button 
                   onClick={(e) => {
                     e.stopPropagation();
                     if ('speechSynthesis' in window) {
                       const utterance = new SpeechSynthesisUtterance(currentWord.word);
                       utterance.lang = 'en-US';
                       window.speechSynthesis.speak(utterance);
                     }
                   }}
                   style={{ fontSize: '24px', background: 'none', border: 'none', cursor: 'pointer', width: '45px', height: '45px', borderRadius: '50%', backgroundColor: '#f1f5f9', color: '#3b82f6', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
                   title="Phát âm tiếng Anh"
                 >
                   🔊
                 </button>
               </div>

               <p style={{ color: '#94a3b8', marginTop: '30px', fontSize: '15px' }}>(Bấm vào thẻ để lật xem nghĩa)</p>
             </div>
          ) : (
             <div style={{ textAlign: 'center', width: '100%', animation: 'fadeIn 0.3s' }}>
               
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '12px' }}>
                 <h4 style={{ fontSize: '20px', margin: 0, color: '#64748b' }}>{currentWord.word}</h4>
                 <button 
                   onClick={(e) => {
                     e.stopPropagation();
                     if ('speechSynthesis' in window) {
                       const utterance = new SpeechSynthesisUtterance(currentWord.word);
                       utterance.lang = 'en-US';
                       window.speechSynthesis.speak(utterance);
                     }
                   }}
                   style={{ fontSize: '16px', background: 'none', border: 'none', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f1f5f9', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
                   title="Phát âm lại"
                 >
                   🔊
                 </button>
               </div>

               <h3 style={{ fontSize: '28px', color: '#10b981', marginBottom: '16px' }}>{currentWord.meaning}</h3>
               
               <div style={{ marginTop: '20px', padding: '20px', backgroundColor: 'var(--bg-primary)', borderRadius: '12px', borderLeft: '4px solid var(--accent-secondary)', textAlign: 'left' }}>
                 <p style={{ margin: 0, color: '#475569', fontStyle: 'italic', fontSize: '16px', lineHeight: '1.6' }}>"{currentWord.example}"</p>
               </div>
               
               <div style={{ marginTop: '20px', padding: '20px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '12px', borderLeft: '4px solid var(--warning)', textAlign: 'left' }}>
                 <p style={{ margin: 0, color: '#92400e', fontWeight: 500, fontSize: '15px' }}>💡 Lưu ý: {currentWord.note}</p>
               </div>
               
               <button 
                 onClick={(e) => {
                   e.stopPropagation();
                   const cleanWord = currentWord.word.replace(/[^a-zA-Z-]/g, '').toLowerCase();
                   
                   // Identify the document containing this word
                   const inDisability = DOCUMENT_CONTENT_DISABILITY.toLowerCase().includes(cleanWord);
                   
                   if (inDisability) {
                     setActiveDoc('disability');
                   } else {
                     setActiveDoc('school');
                   }
                   
                   setTestState('docs');
                   setSelectedWord(cleanWord);
                   
                   // Wait for DOM to render the document view, then scroll
                   setTimeout(() => {
                     const targetElement = document.querySelector('[data-selected="true"]');
                     if (targetElement) {
                       targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                     }
                   }, 300);
                 }}
                 style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#475569', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', margin: '20px auto 0' }}
                 onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                 onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
               >
                 📄 Xem trong văn bản
               </button>
               
             </div>
          )}
        </div>

        {/* Controllers */}
        <div style={{ display: 'flex', gap: '20px', marginTop: '40px', width: '100%', justifyContent: 'space-between' }}>
          <button 
            className="btn-secondary" 
            onClick={() => { setVocabIndex(prev => Math.max(0, prev - 1)); setShowVocabMeaning(false); }}
            disabled={vocabIndex === 0}
            style={{ flex: 1, padding: '16px', fontSize: '18px', opacity: vocabIndex === 0 ? 0.5 : 1 }}
          >
            👈 Quay lại
          </button>
          <button 
            className="btn-primary" 
            onClick={() => { setVocabIndex(prev => Math.min(VOCABULARY_LIST.length - 1, prev + 1)); setShowVocabMeaning(false); }}
            disabled={vocabIndex === VOCABULARY_LIST.length - 1}
            style={{ flex: 1, padding: '16px', fontSize: '18px', backgroundColor: '#3b82f6', borderColor: '#3b82f6', opacity: vocabIndex === VOCABULARY_LIST.length - 1 ? 0.5 : 1 }}
          >
            Tiếp theo 👉
          </button>
        </div>

      </div>
    </div>
  );
  };

  return (
    <main className={styles.main}>
      {testState === 'home' && renderHome()}
      {testState === 'loading' && renderLoading()}
      {testState === 'test' && renderQuestion()}
      {testState === 'results' && renderResults()}
      {testState === 'docs' && renderDocs()}
      {testState === 'vocab' && renderVocab()}
    </main>
  );
}
