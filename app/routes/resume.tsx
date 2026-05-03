import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { usePuterStore } from '~/lib/puter';

export const meta = () => ([
  { title: 'Resumind | Review' },
  { name: 'description', content: 'Detailed overview of your resume' },
])

const Resume = () => {
  const { auth, isLoading, fs, kv } = usePuterStore();
  const { id } = useParams();

  const [imageUrl, setImageUrl] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [feedback, setFeedback] = useState('');
  const [showResume, setShowResume] = useState(false); // 👈 NEW

  const navigate = useNavigate();

  // Auth check
  useEffect(() => {
    if (!isLoading && !auth.isAuthenticated) {
      navigate(`/auth?next=/resume/${id}`);
    }
  }, [isLoading]);

  // Load data
  useEffect(() => {
    const loadResume = async () => {
      const resume = await kv.get(`resume:${id}`);
      if (!resume) return;

      const data = JSON.parse(resume);

      const resumeBlob = await fs.read(data.resumePath);
      const imageBlob = await fs.read(data.imagePath);

      if (!resumeBlob || !imageBlob) return;

      const pdfUrl = URL.createObjectURL(
        new Blob([resumeBlob], { type: 'application/pdf' })
      );
      const imgUrl = URL.createObjectURL(imageBlob);

      setResumeUrl(pdfUrl);
      setImageUrl(imgUrl);
      setFeedback(data.feedback);

      // ⏳ Show image first → then resume
      setTimeout(() => {
        setShowResume(true);
      }, 2000); // change time here (2 sec)
    };

    loadResume();
  }, [id]);

  return (
    <main className="!pt-0">
      <nav className="resume-nav">
        <Link to="/" className="back-button">
          <img src="/icons/back.svg" className="w-2.5 h-2.5" />
          <span className="text-gray-800 text-sm font-semibold">
            Back to Homepage
          </span>
        </Link>
      </nav>

      <div className="flex flex-row w-full max-lg:flex-col-reverse">

        {/* LEFT SIDE */}
        <section className="feedback-section bg-[url('/images/bg-small.svg')] bg-cover h-[100vh] sticky top-0 flex items-center justify-center">

          {/* 🔥 SHOW IMAGE FIRST */}
          {imageUrl && !showResume && (
            <img
              src={imageUrl}
              className="w-[80%] animate-pulse rounded-2xl"
            />
          )}

          {/* 🔥 AFTER DELAY → SHOW CLICKABLE RESUME */}
          {imageUrl && resumeUrl && showResume && (
            <div className="animate-in fade-in duration-1000 w-[80%]">
              <a href={resumeUrl} target="_blank">
                <img
                  src={imageUrl}
                  className="w-full rounded-2xl cursor-pointer"
                />
              </a>
            </div>
          )}
        </section>

        {/* RIGHT SIDE */}
        <section className="feedback-section">
          <h2 className="text-4xl !text-black font-bold">
            Resume Review
          </h2>

          {!showResume ? (
            <img src="/images/resume-scan-2.gif" className="w-full" />
          ) : feedback ? (
            <div className="flex flex-col gap-8 animate-in fade-in duration-1000">
              Summary ATS Details
            </div>
          ) : (
            <img src="/images/resume-scan-2.gif" className="w-full" />
          )}
        </section>

      </div>
    </main>
  );
};

export default Resume;