'use client';

import { useRef, useState } from "react"

export default function GenerateWorkout() {
  const [ftp, setFtp] = useState<number|undefined>()

  const inputFileRef = useRef<HTMLInputElement | null>(null)
  const handleClickOnInputFile = () => {
    inputFileRef.current?.click()
  }
  
  // const workoutLevelOptions = [{ value: '0', label: 'Easy'}, { value: '1', label: 'Moderate'}, { value: '2', label: 'Hard'}]
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

  const setOnlyNumbers = (e: React.InputEvent<HTMLInputElement>) => {
    const onlyNumberValue = e.currentTarget.value.replace(/\D/g, '')
    e.currentTarget.value = onlyNumberValue
  }
  return (
    <form className="flex flex-col gap-7">
      <section className="flex flex-col gap-2">
        <h1 className="text-gray-800">Rider</h1>
        <div className="flex gap-8">
          <label className="flex flex-col gap-1">
            <span className="text-gray-600 text-sm">FTP (watts)</span>
            <input 
              className="border rounded border-gray-400 px-3 py-1" 
              type="text"
              maxLength={4}
              onInput={setOnlyNumbers}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-gray-600 text-sm">Weight (lbs)</span>
            <input 
              className="border rounded border-gray-400 px-3 py-1"
              maxLength={4}
              onInput={setOnlyNumbers}
            />
          </label>
        </div>
      </section>
      <section className="flex flex-col gap-2">
        <h1 className="text-gray-800">Route</h1>
        <div className="flex gap-8">
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
              ref={inputFileRef}
              accept=".tcx"
              onChange={handleUploadFile}
            />
            { isInvalidFile && <p className="text-xs">* Please select a .tcx file only</p> }
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-gray-600 text-sm">Date</span>
            <input className="border rounded border-gray-400 px-3 py-1" type="text" value={date} onChange={handleDateInput}/>
          </label>
        </div>
      </section>
      <section className="flex flex-col gap-2">
        <h1>Bike</h1>
        <label className="flex flex-col w-[220px] gap-1">
          <span className="text-gray-600 text-sm">Weight (lbs)</span>
          <input className="border rounded border-gray-400 px-3 py-1" onInput={setOnlyNumbers}/>
        </label>
      </section>
      <section className="flex flex-col gap-2">
        <h1 className="text-gray-800">Workout</h1>
        <div className="flex flex-col">
          <span className="text-gray-600 text-sm">Difficulty/pace</span>
          <div className="flex flex-col">
            <label className="flex gap-2">
              <input type="radio" value="0" checked={workoutLevel === '0'} onChange={selectWorkoutLevel}/>
              <span className="text-gray-600 text-sm">Easy</span>
            </label>
            <label className="flex gap-2">
              <input type="radio" value="1" checked={workoutLevel === '1'} onChange={selectWorkoutLevel}/>
             <span className="text-gray-600 text-sm">Moderate</span> 
            </label>
            <label className="flex gap-2">
              <input type="radio" value="2" checked={workoutLevel === '2'} onChange={selectWorkoutLevel}/>
              <span className="text-gray-600 text-sm">Hard</span>
            </label>
          </div>
        </div>
      </section>
      <section className="w-full">
        <button 
          className="bg-cyan-700 text-white px-4 py-2 w-full rounded cursor-pointer active:bg-cyan-500"
        >
          Generate workout
        </button>
      </section>
    </form>
  )
}