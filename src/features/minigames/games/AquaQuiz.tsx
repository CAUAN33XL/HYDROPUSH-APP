import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Play, RotateCcw, Check, X } from 'lucide-react';

interface Question {
  question: string;
  options: string[];
  correct: number;
  fact: string;
}

const QUESTIONS: Question[] = [
  {
    question: 'Quantos copos de água (~250ml) são recomendados por dia para um adulto?',
    options: ['4 a 6', '6 a 8', '10 a 12', '2 a 3'],
    correct: 1,
    fact: 'A hidratação ideal gira em torno de 2 litros, ou 8 copos de 250ml.'
  },
  {
    question: 'Qual destes sintomas indica desidratação leve?',
    options: ['Sonolência', 'Sede e boca seca', 'Visão turva', 'Agressividade'],
    correct: 1,
    fact: 'Sede, urina escura e boca seca são os primeiros sinais de desidratação.'
  },
  {
    question: 'O que acontece com o corpo quando você bebe água em jejum?',
    options: ['Fica desidratado', 'Liga o metabolismo e hidrata o organismo', 'Causa azia', 'Nada'],
    correct: 1,
    fact: 'Água em jejum ativa o metabolismo e prepara o corpo para o dia.'
  },
  {
    question: 'Qual porcentagem do corpo humano é composta por água?',
    options: ['Cerca de 30%', 'Cerca de 50%', 'Cerca de 60%', 'Cerca de 90%'],
    correct: 2,
    fact: 'Aproximadamente 60% do corpo adulto é água.'
  },
  {
    question: 'Refrigerantes e sucos industrializados ajudam na hidratação?',
    options: ['Sim, são iguais', 'Não, contêm açúcar e sódio em excesso', 'Só os de limão', 'Apenas em dias quentes'],
    correct: 1,
    fact: 'Bebidas açucaradas podem até piorar a hidratação e sobrecarregar os rins.'
  },
  {
    question: 'Qual a melhor hora para beber a primeira água do dia?',
    options: ['Ao acordar', 'No almoço', 'Antes de dormir', 'Não importa'],
    correct: 0,
    fact: 'Tomar água ao acordar reidrata o corpo após horas sem ingestão.'
  },
  {
    question: 'Urina de qual cor indica boa hidratação?',
    options: ['Amarela escura', 'Amarela clara ou transparente', 'Laranja', 'Roxa'],
    correct: 1,
    fact: 'Urina clara e translúcida é sinal de hidratação adequada.'
  },
  {
    question: 'Do que o corpo precisa para absorver melhor a água?',
    options: ['Sal e açúcar', 'Eletrólitos (sódio e potássio)', 'Ferro', 'Cafeína'],
    correct: 1,
    fact: 'Eletrólitos ajudam a equilibrar a absorção de água nas células.'
  },
  {
    question: 'Quantos litros, em média, uma pessoa perde de água por dia?',
    options: ['0,5 litro', '1 litro', '2 a 3 litros', '5 litros'],
    correct: 2,
    fact: 'Perdemos água na urina, suor e respiração — cerca de 2 a 3 litros/dia.'
  },
  {
    question: 'Qual sintoma NÃO costuma aparecer na desidratação?',
    options: ['Dor de cabeça', 'Cansaço', 'Pele ressecada', 'Aumento da energia'],
    correct: 3,
    fact: 'Desidratação causa fadiga e falta de foco, nunca mais energia.'
  },
  {
    question: 'Tomar água ajuda a emagrecer?',
    options: ['Não, nunca', 'Sim, dando saciedade e acelerando o metabolismo', 'Só com limão', 'Engorda'],
    correct: 1,
    fact: 'Água antes das refeições aumenta a saciedade e auxilia o controle de peso.'
  },
  {
    question: 'O que pode danificar os rins no longo prazo?',
    options: ['Beber muita água', 'Pouca ingestão de água', 'Comer frutas', 'Beber água gelada'],
    correct: 1,
    fact: 'Hidratação insuficiente sobrecarrega os rins na filtração de toxinas.'
  },
  {
    question: 'Qual destas atividades aumenta a necessidade de água?',
    options: ['Ficar parado', 'Exercício físico', 'Dormir', 'Trabalhar no computador'],
    correct: 1,
    fact: 'Durante e após o exercício, a reposição de líquidos deve ser maior.'
  },
  {
    question: 'Beber água antes de dormir pode…',
    options: ['Melhorar o sono', 'Causar idas noturnas ao banheiro', 'Dar pesadelos', 'Prejudicar os rins'],
    correct: 1,
    fact: 'Exagerar antes de dormir aumenta as idas ao banheiro durante a noite.'
  }
];

function pickQuestions(count: number): Question[] {
  const shuffled = [...QUESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function shuffleOptions(q: Question): { question: string; options: string[]; correct: number; fact: string } {
  const order = q.options.map((_, i) => i).sort(() => Math.random() - 0.5);
  return {
    question: q.question,
    options: order.map((i) => q.options[i]),
    correct: order.indexOf(q.correct),
    fact: q.fact
  };
}

export function AquaQuiz({ onExit }: { onExit: () => void }) {
  const [phase, setPhase] = useState<'start' | 'playing' | 'done'>('start');
  const [questions, setQuestions] = useState<{ question: string; options: string[]; correct: number; fact: string }[]>([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [bestScore, setBestScore] = useState(() => {
    return parseInt(localStorage.getItem('aqua_quiz_best') || '0', 10);
  });

  const startGame = () => {
    setQuestions(pickQuestions(10).map(shuffleOptions));
    setCurrent(0);
    setScore(0);
    setSelected(null);
    setPhase('playing');
  };

  const answer = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    if (i === questions[current].correct) {
      const newScore = score + 1;
      setScore(newScore);
      if (current === 9) {
        setPhase('done');
        setBestScore((prev) => {
          const best = Math.max(prev, newScore);
          localStorage.setItem('aqua_quiz_best', best.toString());
          return best;
        });
      }
    }
  };

  const next = () => {
    if (selected === null) return;
    if (current < 9) {
      setCurrent((c) => c + 1);
      setSelected(null);
    } else {
      setPhase('done');
      const finalScore = score;
      setBestScore((prev) => {
        const best = Math.max(prev, finalScore);
        localStorage.setItem('aqua_quiz_best', best.toString());
        return best;
      });
    }
  };

  const q = questions[current];

  return (
    <div className="flex-1 flex flex-col bg-slate-900 text-white select-none overflow-hidden">
      <div className="p-4 flex items-center justify-between bg-slate-900/90 border-b border-slate-800">
        <button onClick={onExit} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <div className="text-center">
          <div className="text-sm text-slate-400">Quiz da Hidratação</div>
          <div className="text-lg font-bold">Score: {score}/10</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-400">Recorde</div>
          <div className="text-lg font-bold text-amber-400">{bestScore}</div>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto relative">
        {phase === 'start' && (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-violet-500 rounded-full mx-auto mb-6 flex items-center justify-center animate-bounce shadow-[0_0_30px_rgba(139,92,246,0.5)]">
              <Play className="w-10 h-10 text-white ml-1" />
            </div>
            <h2 className="text-4xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-300">Quiz de Hidratação</h2>
            <p className="text-slate-300 mb-8 max-w-[280px]">10 perguntas sobre água e saúde. Mostre que você é fera!</p>
            <button
              onClick={startGame}
              className="px-10 py-4 bg-violet-500 rounded-2xl font-bold text-lg active:scale-95 transition-transform"
            >
              Começar
            </button>
          </div>
        )}

        {phase === 'playing' && q && (
          <motion.div
            key={current}
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="max-w-md mx-auto"
          >
            <div className="flex justify-between items-center mb-4 text-sm text-slate-400">
              <span>Pergunta {current + 1}/10</span>
              <div className="flex gap-1">
                {questions.map((_, i) => (
                  <div key={i} className={`w-6 h-1.5 rounded-full ${i < current || (i === current && selected !== null) ? 'bg-violet-400' : 'bg-slate-700'}`} />
                ))}
              </div>
            </div>

            <h3 className="text-xl font-bold mb-5">{q.question}</h3>

            <div className="space-y-3">
              {q.options.map((opt, i) => {
                const isCorrect = i === q.correct;
                const isSelected = i === selected;
                let style = 'border-slate-700 bg-slate-800/60 hover:bg-slate-800';
                let icon = null;
                if (selected !== null) {
                  if (isCorrect) {
                    style = 'border-emerald-400 bg-emerald-500/20';
                    icon = <Check className="w-5 h-5 text-emerald-400" />;
                  } else if (isSelected) {
                    style = 'border-red-400 bg-red-500/20';
                    icon = <X className="w-5 h-5 text-red-400" />;
                  } else {
                    style = 'border-slate-800 bg-slate-800/40 opacity-60';
                  }
                }
                return (
                  <button
                    key={i}
                    onClick={() => answer(i)}
                    disabled={selected !== null}
                    className={`w-full text-left p-4 rounded-2xl border-2 flex items-center justify-between gap-3 transition-all active:scale-[0.98] ${style}`}
                  >
                    <span>{opt}</span>
                    {icon}
                  </button>
                );
              })}
            </div>

            {selected !== null && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-5 p-4 rounded-2xl bg-violet-500/10 border border-violet-500/30 text-sm text-violet-200"
              >
                {q.fact}
              </motion.div>
            )}

            {selected !== null && (
              <button
                onClick={next}
                className="mt-5 w-full py-3 bg-violet-500 rounded-2xl font-bold active:scale-95 transition-transform"
              >
                {current < 9 ? 'Próxima Pergunta' : 'Ver Resultado'}
              </button>
            )}
          </motion.div>
        )}

        {phase === 'done' && (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-slate-800 p-8 rounded-3xl text-center border border-slate-700 shadow-2xl w-full max-w-sm"
            >
              <h2 className="text-2xl font-bold text-violet-400 mb-2">Resultado Final</h2>
              <div className="text-6xl font-black text-white mb-2">{score}<span className="text-2xl text-slate-400">/10</span></div>
              <p className="text-slate-300 mb-1">
                {score >= 9 ? 'Cientista da Hidratação!' : score >= 7 ? 'Muito bem hidratado!' : score >= 5 ? 'Bom, mas dá para melhorar!' : 'Hora de beber mais água!'}
              </p>
              <p className="text-sm text-amber-400 mb-6">Recorde: {bestScore}/10</p>
              <button
                onClick={startGame}
                className="w-full py-4 bg-violet-500 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <RotateCcw className="w-5 h-5" /> Jogar Novamente
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}