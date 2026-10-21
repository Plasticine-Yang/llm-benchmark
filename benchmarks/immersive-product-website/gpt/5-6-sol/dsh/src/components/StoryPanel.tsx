import { useEffect, useRef, useState } from 'react'
import { Close, Play } from './Icons'

type StoryPanelProps = { open: boolean; onClose: () => void }

export function StoryPanel({ open, onClose }: StoryPanelProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [playing, setPlaying] = useState(true)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      setProgress(0)
      setPlaying(true)
      dialog.showModal()
    } else if (!open && dialog.open) dialog.close()
  }, [open])

  useEffect(() => {
    if (!open || !playing) return
    const timer = window.setInterval(() => setProgress((value) => value >= 100 ? 0 : value + 0.35), 90)
    return () => window.clearInterval(timer)
  }, [open, playing])

  const chapter = progress < 33 ? 0 : progress < 66 ? 1 : 2
  const chapters = [
    { number: '01', title: '透明，不是装饰。', body: '让气流与声学路径被看见。双腔体各自处理压力与反射，让低频沉下去，细节浮上来。' },
    { number: '02', title: '空间，由你定义。', body: '个性化 HRTF 描绘你的耳廓与头部特征，把每一个声源稳定地放回真实方向。' },
    { number: '03', title: '长时间，仍然消失。', body: '312 克均衡分布，42 小时续航。戴上它之后，剩下的只有声场。' },
  ]

  const close = () => { dialogRef.current?.close(); onClose() }

  return (
    <dialog ref={dialogRef} className="story-dialog" onCancel={(e) => { e.preventDefault(); close() }} onClose={() => open && onClose()} aria-labelledby="story-title">
      <button className="icon-button story-close" type="button" onClick={close} aria-label="关闭设计故事"><Close /></button>
      <div className={`story-canvas story-chapter-${chapter + 1}`}>
        <div className="story-orbit story-orbit-a" /><div className="story-orbit story-orbit-b" />
        <div className="story-object"><i /><span /><b /></div>
        <div className="story-copy" aria-live="polite">
          <span>DESIGN STORY / {chapters[chapter].number}</span>
          <h2 id="story-title">{chapters[chapter].title}</h2>
          <p>{chapters[chapter].body}</p>
        </div>
        <div className="story-controls glass-surface">
          <button className="story-play" type="button" onClick={() => setPlaying((value) => !value)} aria-label={playing ? '暂停设计故事' : '播放设计故事'}>
            {playing ? <span className="pause-icon"><i /><i /></span> : <Play />}
          </button>
          <div className="story-progress"><i style={{ width: `${progress}%` }} /></div>
          <time>{Math.round(progress * .9).toString().padStart(2, '0')} / 90 SEC</time>
        </div>
      </div>
    </dialog>
  )
}
