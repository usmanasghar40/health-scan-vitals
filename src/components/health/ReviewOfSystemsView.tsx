import React, { useEffect, useMemo, useState } from 'react';
import { 
  ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Info,
  User, Eye, Heart, Wind, Utensils, Droplet, Bone, Hand, Brain, Zap, Droplets, Shield,
  Activity, AlertTriangle, Apple, Flame, Users
} from 'lucide-react';
import { reviewOfSystemsSections, calculatePSSScore, calculatePHQ2Score, calculateGAD2Score, calculateACEScore, interpretPSSScore, interpretPHQ2Score, interpretGAD2Score, interpretACEScore } from '@/data/rosData';
import { ROSAnswer, ROSSection, ROSQuestion } from '@/types/health';

interface ReviewOfSystemsViewProps {
  onComplete?: (answers: ROSAnswer[]) => void;
  initialAnswers?: ROSAnswer[];
}


const iconMap: { [key: string]: React.FC<{ className?: string }> } = {
  User, Eye, Heart, Wind, Utensils, Droplet, Bone, Hand, Brain, Zap, Droplets, Shield,
  Activity, AlertTriangle, Apple, Flame, Users
};

const ReviewOfSystemsView: React.FC<ReviewOfSystemsViewProps> = ({ onComplete, initialAnswers }) => {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: ROSAnswer }>({});
  const [showSummary, setShowSummary] = useState(false);
  const [expandedHelp, setExpandedHelp] = useState<string | null>(null);
  useEffect(() => {
    if (!initialAnswers || initialAnswers.length === 0) return;
    const mapped = initialAnswers.reduce((acc, answer) => {
      acc[answer.questionId] = answer;
      return acc;
    }, {} as { [key: string]: ROSAnswer });
    setAnswers(mapped);
  }, [initialAnswers]);


  const currentSection = reviewOfSystemsSections[currentSectionIndex];
  const totalSections = reviewOfSystemsSections.length;
  const progress = ((currentSectionIndex + 1) / totalSections) * 100;

  const getIcon = (iconName: string) => {
    const Icon = iconMap[iconName] || User;
    return Icon;
  };

  const handleAnswer = (questionId: string, answer: boolean | number | string | string[]) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        questionId,
        answer,
      }
    }));
  };

  const handleMultiSelect = (questionId: string, option: string) => {
    const currentAnswer = answers[questionId]?.answer as string[] || [];
    const newAnswer = currentAnswer.includes(option)
      ? currentAnswer.filter(o => o !== option)
      : [...currentAnswer, option];
    handleAnswer(questionId, newAnswer);
  };

  const handleNext = () => {
    if (currentSectionIndex < totalSections - 1) {
      setCurrentSectionIndex(prev => prev + 1);
      window.scrollTo(0, 0);
    } else {
      setShowSummary(true);
    }
  };

  const handlePrevious = () => {
    if (showSummary) {
      setShowSummary(false);
    } else if (currentSectionIndex > 0) {
      setCurrentSectionIndex(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = () => {
    const answersArray = Object.values(answers);
    if (onComplete) {
      onComplete(answersArray);
    }
  };


  const getSectionCompletionStatus = (section: ROSSection) => {
    const visibleQuestions = section.questions.filter(q => {
      if (!q.conditionalOn) return true;
      const conditionalAnswer = answers[q.conditionalOn];
      return conditionalAnswer?.answer === true;
    });
    const answeredCount = visibleQuestions.filter(q => answers[q.id]).length;
    return {
      answered: answeredCount,
      total: visibleQuestions.length,
      complete: answeredCount === visibleQuestions.length
    };
  };

  const getPositiveFindings = () => {
    return Object.values(answers).filter(a => 
      a.answer === true || 
      (typeof a.answer === 'number' && a.answer >= 7) ||
      (Array.isArray(a.answer) && a.answer.length > 0 && !a.answer.includes('None') && !a.answer.includes('None of these'))
    );
  };

  const shouldShowQuestion = (question: ROSQuestion): boolean => {
    if (!question.conditionalOn) return true;
    const conditionalAnswer = answers[question.conditionalOn];
    return conditionalAnswer?.answer === true;
  };

  // Calculate validated instrument scores
  const psychometricScores = useMemo(() => {
    const answerValues = Object.fromEntries(
      Object.entries(answers).map(([k, v]) => [k, v.answer])
    );
    
    return {
      pss: calculatePSSScore(answerValues),
      phq2: calculatePHQ2Score(answerValues),
      gad2: calculateGAD2Score(answerValues),
      ace: calculateACEScore(answerValues),
    };
  }, [answers]);

  if (showSummary) {
    const positiveFindings = getPositiveFindings();
    
    return (
      <div className="space-y-6">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Review of Systems Summary</h3>
          <p className="text-slate-400 mb-6">
            Please review your answers before submitting. You can go back to make changes if needed.
          </p>

          {/* Psychometric Scores */}
          <div className="mb-6 p-4 bg-slate-700/30 rounded-xl border border-slate-600/30">
            <h4 className="text-lg font-medium text-cyan-400 mb-3">Validated Assessment Scores</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <p className="text-sm text-slate-400">Perceived Stress Scale (PSS-10)</p>
                <p className="text-lg font-semibold text-white">{psychometricScores.pss}/40</p>
                <p className="text-sm text-cyan-400">{interpretPSSScore(psychometricScores.pss)}</p>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <p className="text-sm text-slate-400">Depression Screen (PHQ-2)</p>
                <p className="text-lg font-semibold text-white">{psychometricScores.phq2}/6</p>
                <p className={`text-sm ${psychometricScores.phq2 >= 3 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {interpretPHQ2Score(psychometricScores.phq2)}
                </p>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <p className="text-sm text-slate-400">Anxiety Screen (GAD-2)</p>
                <p className="text-lg font-semibold text-white">{psychometricScores.gad2}/6</p>
                <p className={`text-sm ${psychometricScores.gad2 >= 3 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {interpretGAD2Score(psychometricScores.gad2)}
                </p>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <p className="text-sm text-slate-400">Adverse Childhood Experiences (ACE)</p>
                <p className="text-lg font-semibold text-white">{psychometricScores.ace}/10</p>
                <p className={`text-sm ${psychometricScores.ace >= 4 ? 'text-amber-400' : psychometricScores.ace > 0 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                  {interpretACEScore(psychometricScores.ace)}
                </p>
              </div>
            </div>
          </div>

          {/* Positive Findings */}
          {positiveFindings.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-medium text-amber-400 mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Positive Findings ({positiveFindings.length})
              </h4>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 max-h-64 overflow-y-auto">
                <ul className="space-y-2">
                  {positiveFindings.slice(0, 20).map(finding => {
                    const question = reviewOfSystemsSections
                      .flatMap(s => s.questions)
                      .find(q => q.id === finding.questionId);
                    return (
                      <li key={finding.questionId} className="text-amber-400 text-sm flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{question?.question}</span>
                      </li>
                    );
                  })}
                  {positiveFindings.length > 20 && (
                    <li className="text-amber-400 text-sm">...and {positiveFindings.length - 20} more</li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* Section Summary */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {reviewOfSystemsSections.map((section, index) => {
              const status = getSectionCompletionStatus(section);
              const Icon = getIcon(section.icon);
              const sectionPositives = section.questions.filter(q => {
                const answer = answers[q.id];
                return answer?.answer === true || 
                  (typeof answer?.answer === 'number' && (answer.answer as number) >= 7) ||
                  (Array.isArray(answer?.answer) && answer.answer.length > 0);
              }).length;

              return (
                <button
                  key={section.id}
                  onClick={() => {
                    setShowSummary(false);
                    setCurrentSectionIndex(index);
                  }}
                  className={`p-3 rounded-xl border transition-all text-left ${
                    status.complete 
                      ? 'bg-emerald-500/10 border-emerald-500/30' 
                      : 'bg-slate-700/30 border-slate-600/30 hover:border-slate-500/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 ${status.complete ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span className={`text-xs font-medium truncate ${status.complete ? 'text-emerald-400' : 'text-slate-300'}`}>
                      {section.name.split('/')[0].split('(')[0].trim()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">{status.answered}/{status.total}</span>
                    {sectionPositives > 0 && (
                      <span className="text-xs text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded">
                        {sectionPositives}+
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={handlePrevious}
              className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              Back to Questions
            </button>
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all"
            >
              Submit Review of Systems
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const Icon = getIcon(currentSection.icon);
  const visibleQuestions = currentSection.questions.filter(shouldShowQuestion);

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-400">
            Section {currentSectionIndex + 1} of {totalSections}
          </span>
          <span className="text-sm text-cyan-400 font-medium">
            {Math.round(progress)}% Complete
          </span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Section Navigation */}
      <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-600">
        {reviewOfSystemsSections.map((section, index) => {
          const status = getSectionCompletionStatus(section);
          const SectionIcon = getIcon(section.icon);
          
          return (
            <button
              key={section.id}
              onClick={() => setCurrentSectionIndex(index)}
              className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                index === currentSectionIndex
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : status.complete
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-slate-700/30 text-slate-400 hover:bg-slate-700/50'
              }`}
            >
              <SectionIcon className="w-4 h-4" />
              <span className="text-xs whitespace-nowrap hidden sm:inline">{section.name.split('/')[0].split('(')[0].trim()}</span>
              {status.complete && <CheckCircle2 className="w-3 h-3" />}
            </button>
          );
        })}
      </div>

      {/* Current Section */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
        <div className="flex items-start gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
            <Icon className="w-6 h-6 text-cyan-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-white">{currentSection.name}</h3>
            {currentSection.description && (
              <p className="text-sm text-slate-400 mt-1">{currentSection.description}</p>
            )}
            <p className="text-sm text-slate-500 mt-1">
              {getSectionCompletionStatus(currentSection).answered} of {visibleQuestions.length} answered
            </p>
          </div>
        </div>

        {currentSection.instructions && (
          <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-300">{currentSection.instructions}</p>
            </div>
          </div>
        )}

        {/* Sub-sections indicator */}
        {currentSection.subSections && (
          <div className="mb-6 flex flex-wrap gap-2">
            {currentSection.subSections.map(sub => (
              <span key={sub.id} className="px-3 py-1 bg-slate-700/50 rounded-full text-xs text-slate-300">
                {sub.name}
              </span>
            ))}
          </div>
        )}

        <div className="space-y-4">
          {visibleQuestions.map((question, qIndex) => {
            const answer = answers[question.id];
            const isPositive = answer?.answer === true || 
              (typeof answer?.answer === 'number' && answer.answer >= 7) ||
              (Array.isArray(answer?.answer) && answer.answer.length > 0 && !answer.answer.includes('None'));
            
            return (
              <div 
                key={question.id}
                className={`p-4 rounded-xl border transition-all ${
                  answer 
                    ? isPositive
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-slate-700/30 border-slate-600/30'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <p className="text-white">
                    {qIndex + 1}. {question.question}
                    {question.required && <span className="text-red-400 ml-1">*</span>}
                  </p>
                  {question.helpText && (
                    <button
                      onClick={() => setExpandedHelp(expandedHelp === question.id ? null : question.id)}
                      className="text-slate-400 hover:text-cyan-400 transition-colors"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                {expandedHelp === question.id && question.helpText && (
                  <div className="mb-3 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                    <p className="text-sm text-cyan-300">{question.helpText}</p>
                  </div>
                )}

                {question.category && (
                  <span className="inline-block mb-2 px-2 py-0.5 bg-slate-600/50 rounded text-xs text-slate-400">
                    {currentSection.subSections?.find(s => s.id === question.category)?.name || question.category}
                  </span>
                )}
                
                {/* Boolean Question */}
                {question.type === 'boolean' && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleAnswer(question.id, true)}
                      className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                        answer?.answer === true
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => handleAnswer(question.id, false)}
                      className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                        answer?.answer === false
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                      }`}
                    >
                      No
                    </button>
                  </div>
                )}

                {/* Scale Question */}
                {question.type === 'scale' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>{question.scaleLabels?.low || 'Low (1)'}</span>
                      <span>{question.scaleLabels?.high || 'High (10)'}</span>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                        <button
                          key={num}
                          onClick={() => handleAnswer(question.id, num)}
                          className={`flex-1 py-2 rounded text-sm font-medium transition-all ${
                            answer?.answer === num
                              ? num >= 7 
                                ? 'bg-amber-500 text-white' 
                                : 'bg-cyan-500 text-white'
                              : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Multiple Choice Question */}
                {question.type === 'multiple' && question.options && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {question.options.map(option => (
                      <button
                        key={option}
                        onClick={() => handleAnswer(question.id, option)}
                        className={`p-3 rounded-lg text-left text-sm transition-all ${
                          answer?.answer === option
                            ? 'bg-cyan-500 text-white'
                            : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}

                {/* Frequency Question */}
                {question.type === 'frequency' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {(question.frequencyOptions || ['Never', 'Rarely', 'Sometimes', 'Often', 'Always']).map(option => (
                      <button
                        key={option}
                        onClick={() => handleAnswer(question.id, option)}
                        className={`p-3 rounded-lg text-left text-sm transition-all ${
                          answer?.answer === option
                            ? option === 'Never' || option === 'Almost never' || option === 'Not at all'
                              ? 'bg-emerald-500 text-white'
                              : 'bg-amber-500 text-white'
                            : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}

                {/* Multi-Select Question */}
                {question.type === 'multiselect' && question.options && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {question.options.map(option => {
                      const selected = (answer?.answer as string[] || []).includes(option);
                      return (
                        <button
                          key={option}
                          onClick={() => handleMultiSelect(question.id, option)}
                          className={`p-3 rounded-lg text-left text-sm transition-all flex items-center gap-2 ${
                            selected
                              ? 'bg-cyan-500 text-white'
                              : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                            selected ? 'bg-white border-white' : 'border-slate-400'
                          }`}>
                            {selected && <CheckCircle2 className="w-3 h-3 text-cyan-500" />}
                          </div>
                          {option}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Text Question */}
                {question.type === 'text' && (
                  <textarea
                    value={(answer?.answer as string) || ''}
                    onChange={(e) => handleAnswer(question.id, e.target.value)}
                    placeholder="Please provide details..."
                    className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 resize-none"
                    rows={3}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            onClick={handlePrevious}
            disabled={currentSectionIndex === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              currentSectionIndex === 0
                ? 'text-slate-600 cursor-not-allowed'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all"
          >
            {currentSectionIndex === totalSections - 1 ? 'Review Summary' : 'Next Section'}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewOfSystemsView;
