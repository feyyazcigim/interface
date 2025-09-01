import clsx from "clsx";

export default function Hypernative() {
  return (
    <div className="w-screen h-screen">
      <div className={styles.container}>
        <div>
          <img src={"./pinto-logo.png"} className="w-36 h-36" />
        </div>
        <p className={styles.title}>Pinto is temporarily paused</p>
        <p className={styles.contents}>
          Hypernative's automatic protections were activated, disabling functionality and preventing any risk to the
          system.
        </p>
        <p className={styles.contents}>✅ All funds are safe. Our team is actively investigating.</p>
      </div>
    </div>
  );
}

const styles = {
  container: clsx("absolute inset-0 flex flex-col items-center justify-center px-10 gap-4"),
  title: clsx("pinto-h3 text-center"),
  contents: clsx("pinto-sm sm:pinto-body text-pinto-light sm:text-pinto-light text-center"),
} as const;
