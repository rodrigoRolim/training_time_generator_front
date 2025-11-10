'use client';

import { useRef, useState } from "react"
import Downloading from "@/components/Downloading";

export default function GenerateWorkout() {
  const EASY = '0.8'
  const MODERATE = '1'
  const HARD = '1.2'
  
  const [isDownloading, setIsDownloading] = useState(false)

  const inputFileRef = useRef<HTMLInputElement | null>(null)
  const handleClickOnInputFile = () => {
    inputFileRef.current?.click()
  }
  
  const [workoutLevel,  setWorkoutLevel] = useState('0')
  const selectWorkoutLevel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value
    setWorkoutLevel(value)
  }

  const [filename, setFilename] = useState("upload file")
  const [isInvalidFile, setIsInvalidFile] = useState(false)
  const handleUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0]
    
    if (!file) return
    
    const ext = file?.name.split(".").pop()?.toLocaleLowerCase()
    if (ext !== 'tcx') {
      setIsInvalidFile(true)
      e.currentTarget.value = ""
      return
    }
    setIsInvalidFile(false)
    const filename = file.name.length > 25 ? `${file.name.slice(0, 25)} ... .${ext}` : file.name
    setFilename(filename)
  
  }

  const [date, setDate] = useState("")
  const handleDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let onlyDigitsInput = e.currentTarget.value.replace(/\D/g, '')
    if (onlyDigitsInput.length > 8) onlyDigitsInput = onlyDigitsInput.slice(0, 8)
    
    // mask: mm/dd/yyyy
    if (onlyDigitsInput.length > 4)
      onlyDigitsInput = onlyDigitsInput.replace(/^(\d{2})(\d{2})(\d+)/, "$1/$2/$3");
    else if (onlyDigitsInput.length > 2)
      onlyDigitsInput = onlyDigitsInput.replace(/^(\d{2})(\d+)/, "$1/$2");

    setDate(onlyDigitsInput)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    if (isDownloading) return
    e.preventDefault()
    setIsDownloading(true)
    const form = e.currentTarget
    const formData = new FormData(form)
    try {
      const res = await fetch('http://localhost:8000/workout/create-workout-file', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        throw new Error('Downloading failed!')
      }

      const disposition = res.headers.get("Content-Disposition")
      let filename = 'workout.mrc'

      if (disposition && disposition.includes("filename=")) {
        const match = disposition.match(/filename="?([^"]+)"?/)
        if (match && match[1]) filename = match[1]
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)

      // Download
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch(error) {
      console.error(error)
    } finally {
      setIsDownloading(false)
    }
   
  }
  const allowOnlyDigits = (e: React.InputEvent<HTMLInputElement>) => {
    const onlyNumberValue = e.currentTarget.value.replace(/\D/g, '')
    e.currentTarget.value = onlyNumberValue
  }
  const allowOnlyLbsAsDigit = (e: React.InputEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const raw = input.value.replace(/[\D]/g, "");

    if (!raw) {
      input.value = "";
      return;
    }

    const number = (parseFloat(raw) / 100).toFixed(2); 
    const formatted = number;
    input.value = formatted;
  }
  return (
    <form className="flex flex-col gap-7 w-full" onSubmit={handleSubmit}>
      <section className="flex flex-col gap-2">
        <h1 className="text-gray-800">Rider</h1>
        <div className="flex gap-4 xs:flex-row xs:gap-8 flex-col">
          <label className="flex flex-col gap-1">
            <span className="text-gray-600 text-sm">FTP (watts)</span>
            <input 
              className="border rounded border-gray-400 px-3 py-1" 
              type="text"
              name="ftp"
              maxLength={4}
              onInput={allowOnlyDigits}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-gray-600 text-sm">Weight (lbs)</span>
            <input 
              className="border rounded border-gray-400 px-3 py-1"
              name="rider_mass"
              maxLength={6}
              onInput={allowOnlyLbsAsDigit}
            />
          </label>
        </div>
      </section>
      <section className="flex flex-col gap-2 xs:w-full">
        <h1 className="text-gray-800">Route</h1>
        <div className="flex gap-4 xs:flex-row xs:gap-8 flex-col">
          <label className="flex flex-col gap-1">
            <span className="text-gray-600 text-sm">Upload TCX</span>
            <button 
              className="text-xs bg-gray-100 text-gray-600 rounded border-dashed border px-3 py-2 w-[220px]" 
              type="button"
              onClick={handleClickOnInputFile}
            >{filename}</button>
            <input 
              className="border rounded border-gray-400 hidden" 
              type="file"
              name="file"
              ref={inputFileRef}
              accept=".tcx"
              onChange={handleUploadFile}
            />
            { isInvalidFile && <p className="text-xs">* Please select a .tcx file only</p> }
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-gray-600 text-sm">Date</span>
            <input 
              className="border rounded border-gray-400 px-3 py-1" 
              type="text" 
              name="date" 
              value={date} 
              onChange={handleDateInput}
            />
          </label>
        </div>
      </section>
      <section className="flex flex-col gap-2">
        <h1>Bike</h1>
        <label className="flex flex-col xs:w-[220px] gap-1">
          <span className="text-gray-600 text-sm">Weight (lbs)</span>
          <input className="border rounded border-gray-400 px-3 py-1" name="bike_mass" onInput={allowOnlyLbsAsDigit}/>
        </label>
      </section>
      <section className="flex flex-col gap-2">
        <h1 className="text-gray-800">Workout</h1>
        <div className="flex flex-col">
          <span className="text-gray-600 text-sm">Difficulty/pace</span>
          <div className="flex flex-col">
            <label className="flex gap-2">
              <input type="radio" value={EASY} name="pace" checked={workoutLevel === EASY} onChange={selectWorkoutLevel}/>
              <span className="text-gray-600 text-sm">Easy</span>
            </label>
            <label className="flex gap-2">
              <input type="radio" value={MODERATE} name="pace" checked={workoutLevel === MODERATE} onChange={selectWorkoutLevel}/>
             <span className="text-gray-600 text-sm">Moderate</span> 
            </label>
            <label className="flex gap-2">
              <input type="radio" value={HARD} name="pace" checked={workoutLevel === HARD} onChange={selectWorkoutLevel}/>
              <span className="text-gray-600 text-sm">Hard</span>
            </label>
          </div>
        </div>
      </section>
      <section className="w-full">
        <button 
          className={`bg-cyan-700 text-white px-4 py-2 w-full rounded cursor-pointer ${ isDownloading ? 'opacity-75' : 'active:bg-cyan-500'}`}
          disabled={isDownloading}
        >
          { !isDownloading && <span>Generate workout</span> }
          { isDownloading && <Downloading /> }
        </button>
      </section>
    </form>
  )
}