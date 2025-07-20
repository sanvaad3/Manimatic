import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
// Supabase removed - using local storage
import { writeFile, mkdir } from 'fs/promises'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs'

const execAsync = promisify(exec)

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

async function generateManimCode(userPrompt: string) {
  const prompt = `
    ${userPrompt}

    Generate valid and executable Python code for a Manim animation based strictly on the official Manim documentation (https://docs.manim.community). 

    Instructions:
    - Start with all required imports (e.g., 'from manim import *').
    - Define a class named 'Animation' that inherits from 'Scene' or a relevant Scene subclass.
    - Implement a 'construct' method containing the animation logic.
    - Python code can contain explanations, if specified by user (as part of the animation itself, but should be non intrusive and non-overlapping)
    - Do not assume any external assets (e.g., SVGs, images, audio). Everything must be created using Manim primitives, objects, and methods.
    - The code must be fully self-contained, syntactically correct, and ready to run.
    - Do not include explanations, comments, or markdown—only return the raw Python code 
    `
  
  const response = await model.generateContent(prompt)
  let code = response.response.text()
  
  // Clean up the response
  code = code.replace(/```python\n?/g, '').replace(/```\n?/g, '').trim()
  
  return code
}

async function saveAnimation(filePath: string) {
  try {
    const fileName = `animation_${Date.now()}.mp4`
    const publicDir = path.join(process.cwd(), 'public', 'animations')
    
    // Ensure animations directory exists
    await mkdir(publicDir, { recursive: true })
    
    const destPath = path.join(publicDir, fileName)
    const fileBuffer = fs.readFileSync(filePath)
    await writeFile(destPath, fileBuffer)
    
    const publicUrl = `/animations/${fileName}`
    return { url: publicUrl, success: true }
  } catch (error) {
    console.error('Save animation error:', error)
    return { success: false, error: error }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()
    console.log('Received prompt:', prompt)
    
    if (!prompt) {
      return NextResponse.json({ message: "Prompt is required" }, { status: 400 })
    }

    // Generate Manim code
    const manimCode = await generateManimCode(prompt)
    
    // Create temporary directory for this animation
    const tempDir = path.join(process.cwd(), 'temp', `animation_${Date.now()}`)
    await mkdir(tempDir, { recursive: true })
    
    // Write the code to a file
    const pythonFile = path.join(tempDir, 'main.py')
    await writeFile(pythonFile, manimCode)
    
    // Run Manim to generate the animation
    const outputDir = path.join(tempDir, 'media')
    await mkdir(outputDir, { recursive: true })
    
    try {
      await execAsync(`cd "${tempDir}" && manim -ql main.py Animation`)
      
      // Find the generated video file
      const videoPath = path.join(tempDir, 'media', 'videos', 'main', '480p15', 'Animation.mp4')
      
      if (!fs.existsSync(videoPath)) {
        throw new Error('Animation file not generated')
      }
      
      // Save animation locally
      const uploadResult = await saveAnimation(videoPath)
      
      if (!uploadResult.success) {
        throw new Error('Failed to save animation')
      }
      
      // Clean up temporary files
      fs.rmSync(tempDir, { recursive: true, force: true })
      
      return NextResponse.json({ 
        message: "Success", 
        url: uploadResult.url 
      }, { status: 200 })
      
    } catch (execError) {
      console.error('Manim execution error:', execError)
      // Clean up temporary files
      fs.rmSync(tempDir, { recursive: true, force: true })
      return NextResponse.json({ 
        message: "Failed to generate animation",
        error: execError instanceof Error ? execError.message : 'Unknown error'
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('Generate endpoint error:', error)
    return NextResponse.json({ 
      message: "Internal server error",
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}