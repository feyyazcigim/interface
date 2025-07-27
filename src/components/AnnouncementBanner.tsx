import { Link, useLocation, useNavigate } from "react-router-dom";

export const renderAnnouncement = false;

const ANNOUNCEMENT_URL =
  "https://mirror.xyz/0xEA13D1fB14934E41Ee7074198af8F089a6d956B5/wdRHVI5mzDxMOp3BxKkZBS8m9BbrmWVPYd7dbPI6EMI";

export default function AnnouncementBanner() {
  const _location = useLocation();
  const _navigate = useNavigate();

  // Hide on the overview page
  /*
  if (location.pathname === "/announcing-pinto") {
    return null;
  }
  */
  if (!renderAnnouncement) {
    return null;
  }

  return (
    <div className="w-full hidden sm:flex h-8 border-b border-pinto-gray-4 bg-white items-center justify-center">
      <AnnouncementBannerContent />
    </div>
  );
}

const AnnouncementBannerContent = () => {
  return (
    <div className="flex flex-row justify-center items-center">
      <div className="pinto-sm text-black text-center">
        <Link
          to={ANNOUNCEMENT_URL}
          rel="noopener noreferrer"
          target="_blank"
          className="pinto-sm text-pinto-green-4 cursor-pointer underline inline"
        >
          Come take a tour on the Farm, and read more on the Field!
        </Link>
      </div>
    </div>
  );
};
