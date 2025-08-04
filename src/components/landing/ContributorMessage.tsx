import { useAtom } from "jotai";
import { selectedContributorAtom } from "./ContributorProfiles";

export default function ContributorMessage() {
  const [selectedContributor] = useAtom(selectedContributorAtom);

  return (
    <div className="flex place-self-center text-center mt-8 w-[65%]">
      <p className="text-4xl font-light text-pinto-gray-5">
        "{selectedContributor.description}" - {selectedContributor.name}
      </p>
    </div>
  );
}
