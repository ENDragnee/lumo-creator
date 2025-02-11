"use client"

import { useNode } from "@craftjs/core"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export const QuizSettings = () => {
  const {
    actions: { setProp },
    questions,
  } = useNode((node) => ({
    questions: node.data.props.questions,
  }))

  const addQuestion = () => {
    setProp(
      (props: any) =>
        (props.questions = [...props.questions, { question: "", answers: ["", "", ""], correctAnswer: 0 }]),
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Questions</h3>
      {questions.map((q: any, index: number) => (
        <div key={index} className="space-y-2">
          <Input
            type="text"
            value={q.question}
            onChange={(e) => setProp((props: any) => (props.questions[index].question = e.target.value))}
            placeholder={`Question ${index + 1}`}
          />
          {q.answers.map((answer: string, answerIndex: number) => (
            <Input
              key={answerIndex}
              type="text"
              value={answer}
              onChange={(e) => setProp((props: any) => (props.questions[index].answers[answerIndex] = e.target.value))}
              placeholder={`Answer ${answerIndex + 1}`}
            />
          ))}
        </div>
      ))}
      <Button onClick={addQuestion}>Add Question</Button>
    </div>
  )
}

