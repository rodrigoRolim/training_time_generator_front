'use client';

import { ReactNode, useRef, useState } from "react"
import { useForm, SubmitHandler } from 'react-hook-form'
import * as yup from "yup"
import { yupResolver } from "@hookform/resolvers/yup"
import Downloading from "@/components/Downloading";

type WorkoutInputs = {
  ftp: string;
  rider_mass: number;
  bike_mass: number;
  file: FileList;
  date?: string;
  pace?: string;
}
const schema = yup.object({
  ftp: yup.string().required('FTP is required'),
  rider_mass: yup.number().min(0.01, 'rider weight must be greater than 0').required('Rider weight is required'),
  bike_mass: yup.number().min(0.01, 'bike weight must be greater than 0').required('Bike weight is required'),
  // pace: yup.string().required('Workout level is required'),
  file: yup
    .mixed<FileList>()
    .test("fileRequired", "O arquivo TCX é obrigatório", (value) => {
      if (!value || value.length === 0) return false
      return true
      // return value && value.length > 0
    })
    .test("fileType", "Please select a .tcx file only", (value) => {
      console.log("fileType", value)
      if (!value || (value as FileList).length === 0) return false
      const file = (value as FileList)[0]
      const ext = file.name.split(".").pop()?.toLowerCase()
      return ext === "tcx"
    }),
})

export default function GenerateWorkout() {
  const EASY = '0.8'
  const MODERATE = '1'
  const HARD = '1.2'
  
  const { register, handleSubmit, setValue, trigger, formState: { errors, isSubmitted } } = useForm<WorkoutInputs>({
    resolver: yupResolver(schema) as any,
    mode: 'onSubmit',
  });

  const [isDownloading, setIsDownloading] = useState(false)

  const inputFileRef = useRef<HTMLInputElement | null>(null)
  const handleClickOnInputFile = () => {
    inputFileRef.current?.click()
  }
  
  const [workoutLevel,  setWorkoutLevel] = useState(EASY)
  const selectWorkoutLevel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value
    setWorkoutLevel(value)
  }

  const [filename, setFilename] = useState("upload file")
  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setValue("file", files, { shouldValidate: isSubmitted })
    }

    if (!files || files.length === 0) {
      setFilename("upload file");
      return;
    }

    const file = files[0];
    const ext = file.name.split(".").pop()?.toLowerCase();
    const shortName =
      file.name.length > 25 ? `${file.name.slice(0, 25)}... .${ext}` : file.name;

    setFilename(shortName);

    if (isSubmitted) {
      await trigger("file"); // ✅ revalidate only if the form has already been submitted
    }
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

  const generateWorkout: SubmitHandler<WorkoutInputs> = async (data) => {
    console.log(data)
    if (isDownloading) return

    setIsDownloading(true)
    const formData = new FormData()
    formData.append('ftp', data.ftp)
    formData.append('rider_mass', data.rider_mass.toString())
    formData.append('bike_mass', data.bike_mass.toString())
    formData.append('date', data.date || '')
    formData.append('pace', data.pace || '')
    if (data.file && data.file.length > 0) {
      formData.append('file', data.file[0])
    }
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
      input.value = "0.00";
      return;
    }

    const number = (parseFloat(raw) / 100).toFixed(2); 
    const formatted = number;
    input.value = formatted;
  }
  return (
    <form className="flex flex-col gap-4 w-full" noValidate onSubmit={handleSubmit(generateWorkout)}>
      <section className="flex flex-col gap-2">
        <h1 className="text-gray-800">Rider</h1>
        <div className="flex gap-4 xs:flex-row xs:gap-8 flex-col">
          <label className="flex flex-col gap-1 relative h-20">
            <span className={`text-gray-600 text-sm ${errors.ftp ? 'text-red-600' : ''}`}>FTP (watts)</span>
            <input 
              className={`border rounded border-gray-400 px-3 py-1 ${errors.ftp ? 'border-red-600 outline-red-700' : ''}`}
              type="text"
              maxLength={4}
              aria-invalid={errors.ftp ? "true" : "false"}
              aria-describedby="ftp-error"
              {...register('ftp')}
              onChange={async (e) => {
                register('ftp').onChange(e)
                await trigger('ftp')
              }}
              onInput={allowOnlyDigits}
            />
            {errors.ftp && <p id="ftp-error" className="text-xs text-red-600 absolute bottom-0">{errors.ftp.message}</p>}
          </label>
          <label className="flex flex-col gap-1 h-20 relative">
            <span className={`text-gray-600 text-sm ${errors.rider_mass ? 'text-red-600' : ''}`}>Weight (lbs)</span>
            <input 
              className={`border rounded border-gray-400 px-3 py-1 ${errors.rider_mass ? 'border-red-600 outline-red-700' : ''}`}
              {...register('rider_mass')}
              aria-invalid={errors.rider_mass ? "true" : "false"}
              aria-describedby="rider-mass-error"
              type="text"
              defaultValue="0.00"
              onChange={async (e) => {
                register('rider_mass').onChange(e)
                await trigger('rider_mass')
              }}
              maxLength={6}
              onInput={allowOnlyLbsAsDigit}
            />
            {errors.rider_mass && 
              <p id="rider-mass-error" className="text-xs text-red-600 absolute bottom-0" role="alert">
                {errors.rider_mass.message}
              </p>
            }
          </label>
        </div>
      </section>
      <section className="flex flex-col gap-2 xs:w-full">
        <h1 className="text-gray-800">Route</h1>
        <div className="flex gap-4 xs:flex-row xs:gap-8 flex-col">
          <label className="flex flex-col gap-1 relative h-20">
            <span className="text-gray-600 text-sm">Upload TCX</span>
            <button 
              className={`text-xs bg-gray-100 text-gray-600 rounded border-dashed border px-3 py-2 w-[220px] ${ errors.file ? 'border-red-600' : 'border-gray-400' }`}
              type="button"
              onClick={handleClickOnInputFile}
            >{filename}</button>
            <input 
              className="border rounded border-gray-400 hidden" 
              type="file"
              {...register("file")}
              aria-invalid={errors.file ? "true" : "false"}
              aria-describedby="file-error"
              ref={inputFileRef}
              accept=".tcx"
              onChange={handleUploadFile}
            />
            {/* { isInvalidFile && <p id="file-error" className="text-xs text-red-600 absolute bottom-0">Please select a .tcx file only</p> } */}
            { errors.file && <p id="file-error" className="text-xs text-red-600 absolute bottom-0">{errors.file.message as ReactNode}</p>}
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-gray-600 text-sm">Date</span>
            <input 
              className="border rounded border-gray-400 px-3 py-1" 
              type="text" 
              {...register('date')}
              value={date} 
              onChange={handleDateInput}
            />
          </label>
        </div>
      </section>
      <section className="flex flex-col gap-2">
        <h1>Bike</h1>
        <label className="flex flex-col xs:w-[220px] gap-1 h-20 relative">
          <span className="text-gray-600 text-sm">Weight (lbs)</span>
          <input 
            className={`border rounded border-gray-400 px-3 py-1 ${errors.bike_mass ? 'border-red-600 outline-red-700' : ''}`}
            {...register('bike_mass')}
            aria-invalid={errors.bike_mass ? "true" : "false"}
            aria-describedby="bike-mass-error"
            type="text"
            defaultValue="0.00"
            onChange={async (e) => {
              register('bike_mass').onChange(e)
              await trigger('bike_mass')
            }}
            maxLength={6} 
            onInput={allowOnlyLbsAsDigit}
          />
          {errors.bike_mass && <p id="bike-mass-error" className="text-xs text-red-600 absolute bottom-0">{errors.bike_mass.message}</p>}
        </label>
      </section>
      <section className="flex flex-col gap-2">
        <h1 className="text-gray-800">Workout</h1>
        <div className="flex flex-col">
          <span className="text-gray-600 text-sm">Difficulty/pace</span>
          <div className="flex flex-col">
            <label className="flex gap-2">
              <input type="radio" value={EASY} {...register('pace')} checked={workoutLevel === EASY} onChange={selectWorkoutLevel}/>
              <span className="text-gray-600 text-sm">Easy</span>
            </label>
            <label className="flex gap-2">
              <input type="radio" value={MODERATE} {...register('pace')} checked={workoutLevel === MODERATE} onChange={selectWorkoutLevel}/>
             <span className="text-gray-600 text-sm">Moderate</span> 
            </label>
            <label className="flex gap-2">
              <input type="radio" value={HARD} {...register('pace')} checked={workoutLevel === HARD} onChange={selectWorkoutLevel}/>
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