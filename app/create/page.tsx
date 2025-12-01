"use client"
import { addDays } from "date-fns"
import { redirect } from "next/navigation"

interface Shift {
  id: string
  start: number
  end: number
  count: number
}

// Helper function to generate mock AI predictions
const generateAIPredictions = (startDate: Date) => {
  const predictions = []
  for (let i = 0; i < 7; i++) {
    const date = addDays(startDate, i)
    const dayPrediction = {
      date,
      staffRequirements: {
        ホール: [
          { id: `hall1-${i}`, start: 10, end: 15, count: 2 },
          { id: `hall2-${i}`, start: 17, end: 22, count: 3 },
        ],
        キッチン: [
          { id: `kitchen1-${i}`, start: 9, end: 14, count: 2 },
          { id: `kitchen2-${i}`, start: 16, end: 21, count: 2 },
        ],
      },
    }
    predictions.push(dayPrediction)
  }
  return predictions
}

export default function Create() {
  redirect("/shifts/create")
}

// export default function ShiftCreation() {
//   const [startDate, setStartDate] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
//   const [predictions, setPredictions] = useState(() => generateAIPredictions(startDate))

//   useEffect(() => {
//     setPredictions(generateAIPredictions(startDate))
//   }, [startDate])

//   const handleNotifyEmployees = () => {
//     console.log("Notifying employees via LINE")
//     alert("従業員にLINEで通知しました。")
//   }

//   const handleStaffChange = (dayIndex: number, position: string, shifts: Shift[]) => {
//     setPredictions((prev) => {
//       const newPredictions = [...prev]
//       newPredictions[dayIndex].staffRequirements[position] = shifts
//       return newPredictions
//     })
//   }

//   return (
//     <DndProvider backend={HTML5Backend}>
//       <div className="space-y-8">
//         <div className="rounded-lg bg-white p-4 sm:p-6 shadow-sm">
//           <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0">
//             <h1 className="text-2xl font-bold text-gray-900">シフト作成</h1>
//             <Button onClick={handleNotifyEmployees}>
//               <Send className="mr-2 h-4 w-4" />
//               従業員に通知する
//             </Button>
//           </div>
//           <div className="flex justify-between items-center mb-4">
//             <span>
//               <span className="font-semibold">期間: </span>
//               {format(startDate, "yyyy年MM月dd日", { locale: ja })} -{" "}
//               {format(addDays(startDate, 6), "yyyy年MM月dd日", { locale: ja })}
//             </span>
//             <div className="flex gap-2">
//               <Button onClick={() => setStartDate(addDays(startDate, -7))}>← 前の週</Button>
//               <Button onClick={() => setStartDate(addDays(startDate, 7))}>次の週 →</Button>
//             </div>
//           </div>
//           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-4">
//             {predictions.map((day, index) => (
//               <DayShiftCard
//                 key={index}
//                 day={day}
//                 onStaffChange={(position, shifts) => handleStaffChange(index, position, shifts)}
//               />
//             ))}
//           </div>
//         </div>
//       </div>
//     </DndProvider>
//   )
// }
