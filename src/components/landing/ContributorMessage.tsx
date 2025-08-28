import { useAtom } from "jotai";
import { Link } from "react-router-dom";
import { selectedContributorAtom } from "./ContributorProfiles";

function getBackgroundPosition(contributorName: string): string {
  switch (contributorName) {
    case "natto":
      return "bg-[center_top_0.5rem]";
    case "Ryan":
    case "burr":
      return "bg-[center_bottom_0.25rem]";
    default:
      return "bg-center";
  }
}

export default function ContributorMessage() {
  const [selectedContributor] = useAtom(selectedContributorAtom);

  return (
    <Link
      to={selectedContributor.article}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col place-self-center text-center mt-4 sm:mt-8 w-screen px-4 sm:px-0 sm:w-[65%] h-[250px] sm:h-[400px]"
    >
      <p className="text-xl sm:text-4xl font-light underline text-pinto-green-4 group-hover:text-pinto-green-3 group-hover:brightness-150 transition-all duration-300 mb-4">
        "{selectedContributor.description}" - {selectedContributor.name}
      </p>
      <div
        className={`sm:h-[400px] sm:w-[900px] h-[80px] w-[300px] place-self-center bg-cover ${getBackgroundPosition(selectedContributor.name)} bg-no-repeat rounded-lg`}
        style={{
          backgroundImage: `url(/${selectedContributor.name}-bg.png)`,
          maskImage:
            "linear-gradient(to right, rgba(0,0,0,0) 5%, rgba(0,0,0,1) 7%, rgba(0,0,0,1) 93%, rgba(0,0,0,0) 95%), linear-gradient(to bottom, rgba(0,0,0,0) 5%, rgba(0,0,0,1) 10%, rgba(0,0,0,1) 90%, rgba(0,0,0,0) 95%)",
          maskComposite: "intersect",
        }}
      />
    </Link>
  );
}
