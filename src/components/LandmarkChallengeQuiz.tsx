import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  RotateCcw,
  ArrowRight,
  BookOpen,
  Trophy,
  BrainCircuit,
  Flame,
  Check,
  Compass,
} from 'lucide-react';
import {
  LandmarkHistoryResult,
  LandmarkQuizResult,
  LandmarkRecognitionResult,
  QuizQuestion,
} from '../types';
import { fetchLandmarkQuiz } from '../services/geminiService';

interface LandmarkChallengeQuizProps {
  recognition: LandmarkRecognitionResult;
  history: LandmarkHistoryResult;
}

export const LandmarkChallengeQuiz: React.FC<LandmarkChallengeQuizProps> = ({
  recognition,
  history,
}) => {
  const [quizData, setQuizData] = useState<LandmarkQuizResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([null, null, null]);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [stampSaved, setStampSaved] = useState<boolean>(false);

  // Load quiz questions
  const loadQuiz = async () => {
    setIsLoading(true);
    setHasStarted(false);
    setIsCompleted(false);
    setCurrentIndex(0);
    setUserAnswers([null, null, null]);
    setIsAnswerSubmitted(false);
    setSelectedOption(null);
    setStampSaved(false);

    try {
      const result = await fetchLandmarkQuiz(
        recognition.landmarkName,
        recognition.city,
        recognition.country,
        {
          originStory: history.originStory,
          timeline: history.historicalTimeline,
          hiddenSecrets: history.hiddenSecrets,
          keyFocalPoints: recognition.keyFocalPoints,
        }
      );
      setQuizData(result);
    } catch (error) {
      console.error('Failed to load quiz:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuiz();
  }, [recognition.landmarkName]);

  const questions = quizData?.questions || [];
  const currentQuestion: QuizQuestion | undefined = questions[currentIndex];

  const handleSelectOption = (index: number) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(index);
    setIsAnswerSubmitted(true);

    const updatedAnswers = [...userAnswers];
    updatedAnswers[currentIndex] = index;
    setUserAnswers(updatedAnswers);
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    } else {
      setIsCompleted(true);
      // Calculate final score
      const finalScore = userAnswers.reduce((score, ans, idx) => {
        return score + (ans === questions[idx]?.correctAnswerIndex ? 1 : 0);
      }, 0);

      // Trigger celebratory confetti for perfect score or 2+
      if (finalScore >= 2) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#10b981', '#6366f1', '#ec4899'],
        });
      }
    }
  };

  const calculateScore = () => {
    return userAnswers.reduce((score, ans, idx) => {
      return score + (ans === questions[idx]?.correctAnswerIndex ? 1 : 0);
    }, 0);
  };

  const getRankBadge = (score: number) => {
    if (score === 3) {
      return {
        title: 'Master Architectural Scholar',
        description: 'Flawless recall! You have decoded the secret history and engineering of this world wonder.',
        badgeColor: 'bg-amber-500 text-slate-950 border-amber-300 ring-4 ring-amber-400/20',
        icon: Trophy,
      };
    }
    if (score === 2) {
      return {
        title: 'Seasoned Urban Explorer',
        description: 'Impressive historical acumen! You absorbed key milestones and concealed structural nuances.',
        badgeColor: 'bg-emerald-500 text-slate-950 border-emerald-300 ring-4 ring-emerald-400/20',
        icon: Compass,
      };
    }
    return {
      title: 'Curious Sightseer',
      description: 'A great exploratory effort! Every ancient monument holds secrets waiting to be rediscovered.',
      badgeColor: 'bg-blue-500 text-white border-blue-300 ring-4 ring-blue-400/20',
      icon: BookOpen,
    };
  };

  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden mt-6 transition-colors">
      {/* Quiz Section Header */}
      <div className="p-4 sm:px-6 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-amber-500/10 via-slate-50 dark:via-slate-950 to-indigo-500/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-xs font-bold">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Landmark Challenge</h3>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/20 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-500/30 dark:border-amber-700/60 px-2 py-0.5 rounded-full">
                3-Question Quiz
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Test your knowledge on the history, architecture, and hidden secrets of {recognition.landmarkName}
            </p>
          </div>
        </div>

        {hasStarted && !isCompleted && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-lg shadow-2xs">
              Question {currentIndex + 1} of {questions.length}
            </span>
          </div>
        )}
      </div>

      {/* Main Body */}
      <div className="p-4 sm:p-6">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">
              Generating custom trivia challenge from verified history...
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Curating 3 questions rooted in architectural feats and hidden details.
            </p>
          </div>
        ) : !hasStarted && !isCompleted ? (
          /* Start Screen */
          <div className="py-8 px-2 max-w-xl mx-auto text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 mx-auto flex items-center justify-center shadow-inner">
              <Flame className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h4 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                Ready for the {recognition.landmarkName} Challenge?
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-md mx-auto">
                After taking in the sights and listening to the AR tour, see how many historical milestones, structural tricks, and hidden secrets you can recall.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center py-2 max-w-sm mx-auto">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <span className="block font-bold text-slate-900 dark:text-white text-sm">3</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Questions</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <span className="block font-bold text-slate-900 dark:text-white text-sm">~1 min</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Duration</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <span className="block font-bold text-slate-900 dark:text-white text-sm">Passport</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Stamp Reward</span>
              </div>
            </div>

            <button
              onClick={() => setHasStarted(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] cursor-pointer text-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>Begin Landmark Challenge</span>
            </button>
          </div>
        ) : isCompleted ? (
          /* Completed Score Screen */
          <div className="py-6 max-w-2xl mx-auto space-y-6">
            {(() => {
              const score = calculateScore();
              const rank = getRankBadge(score);
              const RankIcon = rank.icon;

              return (
                <div className="text-center space-y-4">
                  <div className={`w-18 h-18 rounded-3xl mx-auto flex items-center justify-center shadow-lg border-2 ${rank.badgeColor}`}>
                    <RankIcon className="w-9 h-9" />
                  </div>

                  <div>
                    <span className="text-xs font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold">
                      Challenge Completed
                    </span>
                    <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                      {rank.title}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto mt-1">
                      {rank.description}
                    </p>
                  </div>

                  {/* Score Counter */}
                  <div className="inline-flex items-center gap-3 px-5 py-2 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Your Score:</span>
                    <span className="font-mono font-black text-lg text-slate-900 dark:text-white">
                      {score} / {questions.length} Correct
                    </span>
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded-full">
                      {Math.round((score / questions.length) * 100)}%
                    </span>
                  </div>

                  {/* Question Review Accordion / Cards */}
                  <div className="text-left space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <h5 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      Historical Review & Takeaways
                    </h5>

                    {questions.map((q, idx) => {
                      const userPick = userAnswers[idx];
                      const isCorrect = userPick === q.correctAnswerIndex;

                      return (
                        <div
                          key={q.id || idx}
                          className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                            isCorrect
                              ? 'bg-emerald-50/50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80'
                              : 'bg-rose-50/40 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/80'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {idx + 1}. {q.question}
                            </span>
                            {isCorrect ? (
                              <span className="shrink-0 flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                              </span>
                            ) : (
                              <span className="shrink-0 flex items-center gap-1 font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 px-2 py-0.5 rounded-md">
                                <XCircle className="w-3.5 h-3.5" /> Missed
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                            <div>
                              <span className="font-semibold text-slate-700 dark:text-slate-200">Correct Answer: </span>
                              <span className="text-emerald-800 dark:text-emerald-300 font-medium">
                                {q.options[q.correctAnswerIndex]}
                              </span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 italic bg-white/70 dark:bg-slate-900/80 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800">
                              💡 {q.explanation}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      onClick={loadQuiz}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Retake / Generate New Challenge</span>
                    </button>

                    <button
                      onClick={() => setStampSaved(true)}
                      disabled={stampSaved}
                      className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${
                        stampSaved
                          ? 'bg-emerald-600 text-white cursor-default'
                          : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                      }`}
                    >
                      {stampSaved ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Challenge Stamped in Journal!</span>
                        </>
                      ) : (
                        <>
                          <Award className="w-4 h-4" />
                          <span>Stamp Score to Passport</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          /* Active Question Screen */
          currentQuestion && (
            <div className="max-w-xl mx-auto space-y-5">
              {/* Progress Line */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full transition-all duration-300"
                  style={{
                    width: `${((currentIndex + (isAnswerSubmitted ? 1 : 0.5)) / questions.length) * 100}%`,
                  }}
                />
              </div>

              {/* Question Header */}
              <div className="space-y-1.5">
                {currentQuestion.historicalContextSnippet && (
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-md inline-block">
                    {currentQuestion.historicalContextSnippet}
                  </span>
                )}
                <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                  {currentQuestion.question}
                </h4>
              </div>

              {/* 4 Multiple Choice Option Cards */}
              <div className="space-y-2.5">
                {currentQuestion.options.map((option, optIdx) => {
                  const letter = String.fromCharCode(65 + optIdx); // A, B, C, D
                  const isSelected = selectedOption === optIdx;
                  const isCorrect = optIdx === currentQuestion.correctAnswerIndex;

                  let cardStyle = 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 shadow-2xs';
                  let letterBadge = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';

                  if (isAnswerSubmitted) {
                    if (isCorrect) {
                      cardStyle = 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-400 dark:border-emerald-600 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-400/20';
                      letterBadge = 'bg-emerald-500 text-white border-emerald-600';
                    } else if (isSelected) {
                      cardStyle = 'bg-rose-50 dark:bg-rose-950/70 border-rose-400 dark:border-rose-600 text-rose-950 dark:text-rose-100 ring-2 ring-rose-400/20';
                      letterBadge = 'bg-rose-500 text-white border-rose-600';
                    } else {
                      cardStyle = 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 opacity-60';
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      disabled={isAnswerSubmitted}
                      onClick={() => handleSelectOption(optIdx)}
                      className={`w-full p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${cardStyle}`}
                    >
                      <span
                        className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 border ${letterBadge}`}
                      >
                        {letter}
                      </span>
                      <span className="text-xs sm:text-sm font-medium leading-relaxed flex-1">
                        {option}
                      </span>
                      {isAnswerSubmitted && isCorrect && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      )}
                      {isAnswerSubmitted && isSelected && !isCorrect && (
                        <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Post-Answer Educational Explanation */}
              {isAnswerSubmitted && (
                <div
                  className={`p-4 rounded-xl border text-xs space-y-1 animate-fadeIn ${
                    selectedOption === currentQuestion.correctAnswerIndex
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                      : 'bg-amber-50/80 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-200'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5 text-xs">
                    {selectedOption === currentQuestion.correctAnswerIndex ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Spot on! Here's the historical context:</span>
                      </>
                    ) : (
                      <>
                        <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span>Good guess! Here is the historical fact:</span>
                      </>
                    )}
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-xs">
                    {currentQuestion.explanation}
                  </p>
                </div>
              )}

              {/* Next Question / Finish Action */}
              {isAnswerSubmitted && (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleNextQuestion}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-amber-500 hover:bg-slate-800 dark:hover:bg-amber-400 text-white dark:text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all hover:translate-x-0.5 cursor-pointer"
                  >
                    <span>
                      {currentIndex < questions.length - 1 ? 'Next Question' : 'View Results & Scholar Rank'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )
        )}
      </div>
    </section>
  );
};
