import { useRef, useState } from 'react'
import homingSequenceVideo from '../assets/testing videos /homing sequence.mp4'
import elbowJoin5lbsVideo from '../assets/testing videos /elbow join 5lbs.mp4'

const DEMO_PLAYBACK_RATE = 1.5
const DEMO_START_OFFSET = 3

const demoVideos = [
  {
    id: 'homing-sequence',
    title: 'Homing Sequence',
    description:
      'Initial startup routine showing joint homing and reference alignment for repeatable positioning, using the reed switches, by the psuh of a button',
    src: homingSequenceVideo,
  },
  {
    id: 'ellbow-join-5lbs',
    title: 'Ellbow Join 5lbs',
    description: 'Elbow joint load demonstration with a 5 lbs payload.',
    src: elbowJoin5lbsVideo,
    trimToHalf: true,
  },
]

const demoById = new Map(demoVideos.map((demo) => [demo.id, demo]))

function Demos() {
  const [playingById, setPlayingById] = useState({})
  const [timelineById, setTimelineById] = useState({})
  const videoRefs = useRef({})

  const getPlaybackBounds = (videoId, duration) => {
    const safeDuration = Number.isFinite(duration) ? duration : 0
    const start = safeDuration > DEMO_START_OFFSET ? DEMO_START_OFFSET : 0
    const demo = demoById.get(videoId)
    const end = demo?.trimToHalf ? start + (safeDuration - start) / 2 : safeDuration

    return {
      start,
      end: Math.max(start, end),
      span: Math.max(0, end - start),
      safeDuration,
    }
  }

  const applyVideoSettings = (video, videoId) => {
    if (!video) {
      return
    }
    if (video.playbackRate !== DEMO_PLAYBACK_RATE) {
      video.playbackRate = DEMO_PLAYBACK_RATE
      video.defaultPlaybackRate = DEMO_PLAYBACK_RATE
    }
    if (!video.muted) {
      video.muted = true
    }
    if (video.volume !== 0) {
      video.volume = 0
    }
    const { start, end } = getPlaybackBounds(videoId, video.duration)
    if (video.currentTime < start) {
      video.currentTime = start
    }
    if (end > start && video.currentTime >= end) {
      video.currentTime = start
    }
  }

  const toggleVideo = (videoId) => {
    const video = videoRefs.current[videoId]
    if (!video) {
      return
    }
    applyVideoSettings(video, videoId)

    const { start, end } = getPlaybackBounds(videoId, video.duration)
    if (video.currentTime < start) {
      video.currentTime = start
    }
    if (end > start && video.currentTime >= end - 0.02) {
      video.currentTime = start
    }

    if (video.paused) {
      video.play().catch(() => undefined)
      return
    }

    video.pause()
  }

  const updateTimeline = (videoId, currentTime, duration) => {
    const { start, span } = getPlaybackBounds(videoId, duration)
    const adjustedDuration = span
    const adjustedTime = Math.max(0, Math.min(adjustedDuration, currentTime - start))

    setTimelineById((previous) => {
      const current = previous[videoId] ?? { currentTime: 0, duration: 0 }
      if (current.currentTime === adjustedTime && current.duration === adjustedDuration) {
        return previous
      }
      return {
        ...previous,
        [videoId]: {
          currentTime: adjustedTime,
          duration: adjustedDuration,
        },
      }
    })
  }

  const seekVideo = (videoId, nextTime) => {
    const video = videoRefs.current[videoId]
    if (!video) {
      return
    }
    const { start, span } = getPlaybackBounds(videoId, video.duration)
    const adjustedDuration = span
    const clippedRelativeTime = Math.max(0, Math.min(nextTime, adjustedDuration))
    const targetTime = start + clippedRelativeTime

    video.currentTime = targetTime
    updateTimeline(videoId, targetTime, video.duration)
  }

  return (
    <main className="hero-page demos-page">
      <div className="hero-content demos-content">
        <header className="hero-header">
          <h1 className="hero-title">
            <span className="hero-title-prefix">Team 17</span>
            <span className="hero-title-main">C-3PA</span>
          </h1>
          <nav className="hero-nav" aria-label="Primary">
            <a className="nav-tab" href="#/">
              Home
            </a>
            <a className="nav-tab" href="#/products">
              Products
            </a>
            <a className="nav-tab is-active" href="#/demos" aria-current="page">
              Demos
            </a>
          </nav>
        </header>

        <section className="demos-sequence" aria-label="Demo and testing videos">
          {demoVideos.map((demo) => (
            <article className="demo-item" key={demo.id}>
              <header className="demo-item-header">
                <h2>{demo.title}</h2>
                <p>{demo.description}</p>
              </header>

              <div className="demo-video-wrap">
                <div className="demo-video-shell">
                {(() => {
                  const timeline = timelineById[demo.id] ?? { currentTime: 0, duration: 0 }
                  const progressPercent =
                    timeline.duration > 0 ? Math.min(100, Math.max(0, (timeline.currentTime / timeline.duration) * 100)) : 0

                  return (
                    <>
                <video
                  className="demo-video"
                  preload="metadata"
                  playsInline
                  muted
                  ref={(node) => {
                    videoRefs.current[demo.id] = node
                  }}
                  onClick={() => toggleVideo(demo.id)}
                  onLoadedMetadata={(event) => {
                    const video = event.currentTarget
                    applyVideoSettings(video, demo.id)
                    updateTimeline(
                      demo.id,
                      Number.isFinite(video.currentTime) ? video.currentTime : 0,
                      Number.isFinite(video.duration) ? video.duration : 0,
                    )
                  }}
                  onTimeUpdate={(event) => {
                    const video = event.currentTarget
                    const { end, start } = getPlaybackBounds(demo.id, video.duration)
                    if (!video.paused && end > start && video.currentTime >= end) {
                      video.currentTime = end
                      video.pause()
                    }
                    updateTimeline(
                      demo.id,
                      Number.isFinite(video.currentTime) ? video.currentTime : 0,
                      Number.isFinite(video.duration) ? video.duration : 0,
                    )
                  }}
                  onPlay={() => setPlayingById((previous) => ({ ...previous, [demo.id]: true }))}
                  onPause={() => setPlayingById((previous) => ({ ...previous, [demo.id]: false }))}
                  onEnded={() => setPlayingById((previous) => ({ ...previous, [demo.id]: false }))}
                  onRateChange={(event) => applyVideoSettings(event.currentTarget)}
                >
                  <source src={demo.src} type="video/mp4" />
                  Your browser does not support this video format.
                </video>

                <div className="demo-progress-wrap">
                  <input
                    className="demo-progress-slider"
                    type="range"
                    min={0}
                    max={timeline.duration > 0 ? timeline.duration : 1}
                    step="0.01"
                    value={timeline.currentTime}
                    style={{ '--demo-progress': `${progressPercent}%` }}
                    onInput={(event) => seekVideo(demo.id, Number(event.currentTarget.value))}
                    onChange={(event) => seekVideo(demo.id, Number(event.currentTarget.value))}
                    aria-label={`Seek ${demo.title} video timeline`}
                  />
                </div>

                {!playingById[demo.id] && (
                  <button
                    type="button"
                    className="demo-play-button"
                    onClick={() => toggleVideo(demo.id)}
                    aria-label={`Play ${demo.title} video`}
                  >
                    <span className="demo-play-icon" aria-hidden="true">
                      ▶
                    </span>
                  </button>
                )}
                    </>
                  )
                })()}
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  )
}

export default Demos
