import React, { useContext } from "react";
import {
  IconBrandYoutubeFilled,
  IconBrowser,
  IconFile,
  IconLink,
  IconList,
  IconMessageFilled,
  IconRefresh,
  IconScreenShare,
  IconVideo,
  IconUsers,
  IconPlayerPlay,
  IconLock,
} from "@tabler/icons-react";
import { NewRoomButton } from "../TopBar/TopBar";
import styles from "./Home.module.css";
import { MetadataContext } from "../../MetadataContext";

export const Home = () => {
  const { user } = useContext(MetadataContext);

  return (
    <div className={styles.pageWrapper}>
      {/* Hero Section */}
      <div className={styles.heroSection}>
        <div className={styles.heroGlow} />
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>✦ Free Forever · No Downloads</div>
          <h1 className={styles.heroHeading}>
            Watch Together,<br />
            <span className={styles.heroAccent}>Anywhere.</span>
          </h1>
          <p className={styles.heroSubtext}>
            Sync videos with friends in real time. No lag, no hassle — just hit play.
          </p>
          <div className={styles.heroActions}>
            <NewRoomButton size="xl" />
          </div>
        </div>
        <div className={styles.heroVisual}>
          <img src="/screenshot4.png" alt="WatchParty preview" className={styles.heroImage} />
          <div className={styles.heroImageGlow} />
        </div>
      </div>

      {/* Features Grid */}
      <div className={styles.featuresSection}>
        <div className={styles.sectionLabel}>What's included</div>
        <h2 className={styles.sectionTitle}>Everything you need to watch together</h2>
        <div className={styles.featuresGrid}>
          <Feature Icon={IconBrowser} title="Virtual Browser" text="Watch on a cloud browser everyone sees at once." accent="#38bdf8" />
          <Feature Icon={IconBrandYoutubeFilled} title="YouTube" text="Stream any YouTube video in perfect sync." accent="#f87171" />
          <Feature Icon={IconScreenShare} title="Screenshare" text="Share your tab or desktop with one click." accent="#a78bfa" />
          <Feature Icon={IconFile} title="Your Files" text="Upload and stream your own video files." accent="#34d399" />
          <Feature Icon={IconLink} title="Any URL" text="Paste any video URL and watch together." accent="#fbbf24" />
          <Feature Icon={IconVideo} title="Video Chat" text="Face-to-face while you watch." accent="#f472b6" />
        </div>
      </div>

      {/* Sync Section */}
      <div className={styles.splitSection}>
        <div className={styles.splitVisual}>
          <img src="/screenshot18.png" alt="Reactions" className={styles.splitImage} />
        </div>
        <div className={styles.splitText}>
          <div className={styles.sectionLabel}>Real-time reactions</div>
          <h2 className={styles.splitHeading}>React to moments <span className={styles.heroAccent}>together.</span></h2>
          <p className={styles.splitBody}>
            Emoji reactions, live chat, and synchronized playback make every moment feel shared — even when you're miles apart.
          </p>
          <div className={styles.splitFeatures}>
            <div className={styles.splitFeatureItem}><IconRefresh size={18} color="#34d399" /> Instant sync across all viewers</div>
            <div className={styles.splitFeatureItem}><IconMessageFilled size={18} color="#38bdf8" /> Live chat with emoji reactions</div>
            <div className={styles.splitFeatureItem}><IconList size={18} color="#a78bfa" /> Shared video playlists</div>
          </div>
        </div>
      </div>

      {/* Theater Section */}
      <div className={`${styles.splitSection} ${styles.splitReverse}`}>
        <div className={styles.splitVisual}>
          <img src="/screenshot14.png" alt="Theater mode" className={styles.splitImage} />
        </div>
        <div className={styles.splitText}>
          <div className={styles.sectionLabel}>Immersive experience</div>
          <h2 className={styles.splitHeading}>Theater mode, <span className={styles.heroAccent}>built in.</span></h2>
          <p className={styles.splitBody}>
            Collapse the clutter and bring video and chat front-and-center. Designed for long sessions with friends.
          </p>
          <div className={styles.splitFeatures}>
            <div className={styles.splitFeatureItem}><IconPlayerPlay size={18} color="#fbbf24" /> Distraction-free playback</div>
            <div className={styles.splitFeatureItem}><IconLock size={18} color="#f87171" /> Room lock & controls</div>
            <div className={styles.splitFeatureItem}><IconUsers size={18} color="#34d399" /> Multi-viewer support</div>
          </div>
        </div>
      </div>

      {/* Get Started Steps */}
      <div className={styles.stepsSection}>
        <div className={styles.sectionLabel}>Quick start</div>
        <h2 className={styles.sectionTitle}>Up and running in seconds</h2>
        <div className={styles.stepsGrid}>
          <StepCard number="01" title="Create a room" text="Hit New Room — it's instant, no account needed." />
          <StepCard number="02" title="Share the link" text="Send your unique room URL to anyone." />
          <StepCard number="03" title="Pick a video" text="YouTube, URL, file, or virtual browser." />
          <StepCard number="04" title="Watch together" text="Everyone stays perfectly in sync, automatically." />
        </div>
        <div style={{ marginTop: "40px" }}>
          <NewRoomButton size="lg" />
        </div>
      </div>
    </div>
  );
};

const Feature = ({ Icon, text, title, accent }) => (
  <div className={styles.featureCard}>
    <div className={styles.featureIconWrap} style={{ background: accent + "18", border: `1px solid ${accent}30` }}>
      <Icon size={28} color={accent} />
    </div>
    <h3 className={styles.featureTitle}>{title}</h3>
    <p className={styles.featureText}>{text}</p>
  </div>
);

const StepCard = ({ number, title, text }) => (
  <div className={styles.stepCard}>
    <div className={styles.stepNumber}>{number}</div>
    <h3 className={styles.stepTitle}>{title}</h3>
    <p className={styles.stepText}>{text}</p>
  </div>
);

export const Hero = ({ heroText, subText, subText2, action, image, color }) => (
  <div className={`${styles.hero} ${color === "green" ? styles.green : ""}`}>
    <div style={{ flexDirection: color === "green" ? "row-reverse" : undefined }} className={styles.heroInner}>
      <div style={{ padding: "30px", flex: "1 1 0" }}>
        <div className={styles.heroText}>{heroText}</div>
        <div className={styles.subText}>{subText}</div>
        <div className={styles.subText}>{subText2}</div>
        {action}
      </div>
      <div style={{ flex: "1 1 0" }}>
        <img alt="hero" style={{ width: "100%", borderRadius: "10px" }} src={image} />
      </div>
    </div>
  </div>
);

export const DiscordBot = () => null;
