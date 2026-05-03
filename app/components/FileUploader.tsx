import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'

interface FileUploaderProps {
  onFileSelect?: (file: File | null) => void
}

const FileUploader = ({ onFileSelect }: FileUploaderProps) => {
  const [file, setFile] = useState<File | null>(null)

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 ** 2) return (bytes / 1024).toFixed(2) + ' KB'
    if (bytes < 1024 ** 3) return (bytes / 1024 ** 2).toFixed(2) + ' MB'
    return (bytes / 1024 ** 3).toFixed(2) + ' GB'
  }

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const selectedFile = acceptedFiles[0] || null
      setFile(selectedFile)           // ✅ store locally
      onFileSelect?.(selectedFile)    // ✅ send to parent
    },
    [onFileSelect]
  )

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    multiple: false,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 20 * 1024 * 1024
  })

  const removeFile = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    setFile(null)              // ✅ clear UI
    onFileSelect?.(null)       // ✅ clear parent state
  }

  return (
    <div className="w-full gradient-border">
      <div {...getRootProps()}>
        <input {...getInputProps()} />

        <div className="space-y-4 cursor-pointer">
          <div className="mx-auto w-16 h-16 flex items-center justify-center">
            <img
              src="/icons/info.svg"
              alt="upload"
              className="size-20"
            />
          </div>

          {file ? (
            <div
              className="uploader-selected-file flex items-center justify-between space-x-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center space-x-3">
                <img
                  src="/images/pdf.png"
                  alt="pdf"
                  className="size-10"
                />

                <div>
                  <p className="text-sm font-medium text-gray-700 truncate max-w-xs">
                    {file.name}
                  </p>

                  <p className="text-sm text-gray-500">
                    {formatSize(file.size)}
                  </p>
                </div>
              </div>

              <button
                className="p-2 cursor-pointer"
                onClick={removeFile}
              >
                <img
                  src="/icons/cross.svg"
                  alt="remove"
                  className="w-4 h-4"
                />
              </button>
            </div>
          ) : (
            <div>
              <p className="text-lg text-gray-500">
                <span className="font-semibold">
                  Click to upload
                </span>{' '}
                or drag and drop
              </p>

              <p className="text-lg text-gray-500">
                PDF (max 20 MB)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FileUploader