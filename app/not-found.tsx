import Link from "next/link";

export default function NotFound() {
  return (
    <div className="frame">
      <p className="eyebrow">404</p>
      <h1 className="page-title">That page is not on the bench.</h1>
      <p><Link href="/lessons">Back to the lessons</Link></p>
    </div>
  );
}
