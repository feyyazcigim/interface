import { useAtom } from "jotai";
import { selectedContributorAtom } from "./ContributorProfiles";

export default function ContributorMessage() {
  const [selectedContributor] = useAtom(selectedContributorAtom);

  return (
    <div className="flex place-self-center text-center mt-4 sm:mt-8 w-screen px-4 sm:px-0 sm:w-[65%]">
      <p className="text-xl sm:text-4xl font-light text-pinto-gray-5">
        "{selectedContributor.description}" - {selectedContributor.name}
      </p>
    </div>
  );
}
