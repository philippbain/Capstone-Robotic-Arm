import fullRobotImage from '../assets/Hero photos/Full robot2.png'
import teamPictureImage from '../assets/Hero photos/team picture.png'
import { useEffect, useState } from 'react'

const productDescription = `Our project is a multi-purpose, adaptable 5-DOF robotic arm designed to evolve with the user's needs. Built with a modular design and primarily using 3D-printed PLA components, it is easy to manufacture, modify, and expand. As an open-source platform, it can be customized with any code or hardware, including future additions like cameras, computer vision, or ultrasonic sensors. With a payload capacity of 5 lbs, it is capable of handling a wide range of tasks.

Our first proof of concept focuses on automating Bambu Lab 3D printers. The robot autonomously removes completed prints, swaps build plates, and keeps production running continuously. While this demonstrates its capabilities, the system is ultimately designed to be flexible and adaptable to whatever the user wants it to become.`

const teamMembers = [
  { name: 'Henry Kwan', role: 'Team Leader' },
  { name: 'Nicholas Bradley', role: 'Electrical & Electronics Lead' },
  { name: 'William Mambengat', role: 'Controls & Programming Lead' },
  { name: 'Nicolas Desaulniers', role: 'Manufacturing & Assembly Lead' },
  { name: 'Philipp Bain', role: 'Mechanical Lead' },
  { name: 'Jacob Vallee', role: 'Testing & Documentation Lead' },
  { name: 'Brandon Gordon', role: 'Supervisor' },
  { name: 'Michael Rembacz', role: 'Professor/Mentor/Sponsor' },
]

const contactEmails = [
  { name: 'Henry Kwan', email: 'he_kwan@live.concordia.ca' },
  { name: 'Nicholas Bradley', email: 'bradleynick19@gmail.com' },
  { name: 'William Mambengat', email: 'w_yembim@live.concordia.ca' },
  { name: 'Nicolas Desaulniers', email: 'n_desaulniers@outlook.com' },
  { name: 'Philipp Bain', email: 'philippbain@gmail.com' },
  { name: 'Jacob Vallee', email: 'ja_val@live.concordia.ca' },
]

function Hero() {
  const [robotCutoutImage, setRobotCutoutImage] = useState(fullRobotImage)

  useEffect(() => {
    const createRobotCutout = async () => {
      const img = new Image()
      img.src = fullRobotImage

      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
      })

      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const context = canvas.getContext('2d')

      if (!context) {
        return fullRobotImage
      }

      context.drawImage(img, 0, 0)
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      const width = canvas.width
      const height = canvas.height
      const totalPixels = width * height

      const visited = new Uint8Array(totalPixels)
      const queue = new Uint32Array(totalPixels)
      let head = 0
      let tail = 0

      const isBackgroundTone = (flatIndex) => {
        const idx = flatIndex * 4
        const r = data[idx]
        const g = data[idx + 1]
        const b = data[idx + 2]
        // Treat only very-near-black neutral tones as removable background.
        return r <= 10 && g <= 10 && b <= 10 && Math.abs(r - g) <= 4 && Math.abs(g - b) <= 4
      }

      const push = (x, y) => {
        if (x < 0 || x >= width || y < 0 || y >= height) {
          return
        }
        const flat = y * width + x
        if (visited[flat] === 1) {
          return
        }
        if (!isBackgroundTone(flat)) {
          return
        }
        visited[flat] = 1
        queue[tail] = flat
        tail += 1
      }

      for (let x = 0; x < width; x += 1) {
        push(x, 0)
        push(x, height - 1)
      }
      for (let y = 1; y < height - 1; y += 1) {
        push(0, y)
        push(width - 1, y)
      }

      while (head < tail) {
        const flat = queue[head]
        head += 1
        const x = flat % width
        const y = Math.floor(flat / width)

        push(x - 1, y)
        push(x + 1, y)
        push(x, y - 1)
        push(x, y + 1)
      }

      for (let flat = 0; flat < totalPixels; flat += 1) {
        if (visited[flat] === 1) {
          data[flat * 4 + 3] = 0
        }
      }

      context.putImageData(imageData, 0, 0)
      return canvas.toDataURL('image/png')
    }

    let isCancelled = false

    createRobotCutout()
      .then((result) => {
        if (!isCancelled) {
          setRobotCutoutImage(result)
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setRobotCutoutImage(fullRobotImage)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [])

  return (
    <main className="hero-page">
      <div className="grid-overlay" aria-hidden="true"></div>
      <div className="hero-content">
        <header className="hero-header">
          <h1 className="hero-title">
            <span className="hero-title-prefix">Team 17</span>
            <span className="hero-title-main">Robotic Arm</span>
          </h1>
          <nav className="hero-nav" aria-label="Primary">
            <a className="nav-tab is-active" href="#" aria-current="page">
              Home
            </a>
            <a className="nav-tab" href="#">
              Product
            </a>
            <a className="nav-tab" href="#">
              Engineering
            </a>
          </nav>
        </header>

        <section className="top-row" aria-label="Product overview">
          <div className="product-copy">
            <h2>Product Description</h2>
            <p>{productDescription}</p>
          </div>
          <figure className="robot-panel">
            <img className="hero-image robot-image" src={robotCutoutImage} alt="Team 17 full robotic arm prototype" />
          </figure>
        </section>

        <section className="team-org-section" aria-label="Team details">
          <h2>Team Overview</h2>
          <div className="team-layout">
            <figure className="team-wide-panel">
              <img className="hero-image" src={teamPictureImage} alt="Team picture for Team 17" />
            </figure>
            <aside className="team-description-panel" aria-label="Team description">
              <h3>Team Members & Roles</h3>
              <ul className="team-name-list" aria-label="Team members">
                {teamMembers.map((member) => (
                  <li key={`${member.name}-${member.role}`}>
                    <span className="member-name">{member.name}</span>
                    <span className="member-role">{member.role}</span>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </section>

        <section className="contact-section" aria-label="Contact information">
          <h2>Contact Us</h2>
          <ul className="contact-list">
            {contactEmails.map((contact) => (
              <li key={contact.email}>
                <span className="contact-name">{contact.name}</span>
                <a className="contact-email" href={`mailto:${contact.email}`}>
                  {contact.email}
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  )
}

export default Hero
