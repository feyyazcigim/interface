import { cn } from "@/utils/utils";

interface SVGProps {
  color?: string;
  width?: number | string;
  height?: number | string;
  className?: string;
}

export const ExternalLinkIcon = ({ color = "#9C9C9C", width = 24, height = 24 }: SVGProps) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M21 13V18C21 19.6569 19.6569 21 18 21H6C4.34315 21 3 19.6569 3 18V6C3 4.34315 4.34315 3 6 3H11"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M21 3L13.5 10.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M21 8.5V3H15.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const GearIcon = ({ color = "#9C9C9C", width = 16, height = 16 }: SVGProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} fill={color} viewBox="0 0 16 16">
    <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z" />
  </svg>
);

export const InfoSolidIcon = ({ color = "#9C9C9C", width = 16, height = 16 }: SVGProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} fill="none" viewBox="0 0 16 16">
    <path
      fill={color}
      fillRule="evenodd"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M8 14A6 6 0 1 1 8 2a6 6 0 0 1 0 12Z"
      clipRule="evenodd"
    />
    <path
      stroke="#fff"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M8 8v3.333M7.999 5.333A.167.167 0 1 0 8 5.666.167.167 0 0 0 8 5.334"
    />
  </svg>
);

export const SwitchPDVIcon = ({ color = "#9C9C9C", width = 16, height = 16 }: SVGProps) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 8.5L14 16.5L16 14.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 16.5L10 8.5L8 10.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M3 12.5V12.5C3 17.471 7.029 21.5 12 21.5V21.5C16.971 21.5 21 17.471 21 12.5V12.5C21 7.529 16.971 3.5 12 3.5V3.5C7.029 3.5 3 7.529 3 12.5Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const InfoOutlinedIcon = ({ color = "#9C9C9C", width = 16, height = 16 }: SVGProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} fill="none" viewBox="0 0 16 16">
    <path
      fill="#fff"
      fillRule="evenodd"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M8 14A6 6 0 1 1 8 2a6 6 0 0 1 0 12Z"
      clipRule="evenodd"
    />
    <path
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M8 8v3.333M8 5.333A.167.167 0 1 0 8 5.666a.167.167 0 0 0-.002-.333"
    />
  </svg>
);

export const ForwardArrowIcon = ({ color = "#9C9C9C", width = 16, height = 16 }: SVGProps) => (
  <svg width={width} height={height} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M10.6673 7L8.00065 4.33333L5.33398 7"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M11.3337 11.6666L8.00033 8.33329L4.66699 11.6666"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const UpDownArrowsIcon = ({ color = "#9C9C9C", width = 19, height = 16 }: SVGProps) => (
  <svg width={width} height={height} viewBox="0 0 19 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.5 4L4.5 1L1.5 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4.5 15V1" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M11.5 12L14.5 15L17.5 12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14.5 1V15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const LeftArrowIcon = ({ color = "#9C9C9C", width = 17, height = 12 }: SVGProps) => (
  <svg width={width} height={height} viewBox="0 0 17 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15.5 6H1.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10.5 11L15.5 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10.5 1L15.5 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const UpArrowIcon = ({ color = "#9C9C9C", width = 16, height = 16 }: SVGProps) => (
  <svg width={width} height={height} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M7.99992 12.6666V3.33325M7.99992 3.33325L3.33325 7.99992M7.99992 3.33325L12.6666 7.99992"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const BackwardArrowDotsIcon = ({ color = "#9C9C9C", width = 25, height = 24 }: SVGProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} fill="none">
    <path
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M12.5 4.997H5.497M12.5 4.997a8.003 8.003 0 1 1-8.003 8.004M8.499 1.996 5.497 4.997M8.499 7.999 5.497 4.997"
    />
    <path
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M12.5 12.82a.18.18 0 1 0 .002.36.18.18 0 0 0-.002-.36M12.5 15.943a.18.18 0 1 0 .002.36.18.18 0 0 0-.002-.36M15.101 14.441a.18.18 0 1 0 0 .36.18.18 0 0 0 0-.36M9.9 14.441a.18.18 0 1 0 .001.36.18.18 0 0 0-.002-.36M9.9 11.439a.18.18 0 1 0 .001.36.18.18 0 0 0-.002-.36M15.101 11.441a.18.18 0 1 0 0 .36.18.18 0 0 0 0-.36M12.5 9.94a.18.18 0 1 0 .002.36.18.18 0 0 0-.002-.36"
    />
    <path
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M12.5 9.94a.18.18 0 1 0 0 .36.18.18 0 0 0 0-.36"
    />
  </svg>
);

export const ChevronDownIcon = ({ color = "#9C9C9C", width = 15, height = 15, className = "" }: SVGProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} fill="none" className={className}>
    <path
      fill={color}
      fillRule="evenodd"
      d="M3.135 6.158a.5.5 0 0 1 .707-.023L7.5 9.565l3.658-3.43a.5.5 0 0 1 .684.73l-4 3.75a.5.5 0 0 1-.684 0l-4-3.75a.5.5 0 0 1-.023-.707Z"
      clipRule="evenodd"
    />
  </svg>
);

export const ChevronRightIcon = ({ color = "#9C9C9C", width = 16, height = 16 }: SVGProps) => (
  <svg width={width} height={height} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g id="Group">
      <path
        id="Path"
        d="M6.6665 10.667L9.33317 8.00033L6.6665 5.33366"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  </svg>
);

export const ChevronLeftIcon = ({ color = "#9C9C9C", width = 16, height = 16 }: SVGProps) => (
  <svg width={width} height={height} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <path
      d="M15.707 4.293a1 1 0 0 0-1.414 0l-7 7a1 1 0 0 0 0 1.414l7 7a1 1 0 0 0 1.414-1.414L9.414 12l6.293-6.293a1 1 0 0 0 0-1.414z"
      fill={color}
    />
  </svg>
);

export const CloseIconAlt = ({ color = "#9C9C9C", width = 32, height = 32 }: SVGProps) => (
  <svg width={width} height={height} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M9.33334 9.33325L22.6667 22.6666"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9.33334 22.6666L22.6667 9.33325"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const UpRightArrowIcon = ({ color = "#9C9C9C", width = 12, height = 13 }: SVGProps) => (
  <svg width={width} height={height} viewBox="0 0 12 13" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M10.95 1.54688L1.05005 11.4469"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M4 1.5L10.95 1.549L11 8.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CloseIcon = ({ color = "#9C9C9C", width = 9, height = 10 }: SVGProps) => (
  <svg width={width} height={height} viewBox="0 0 9 10" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M1.16675 1.66675L7.83341 8.33341"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M1.16675 8.33341L7.83341 1.66675"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const CheckmarkIcon = ({ color = "#9C9C9C", width = 24, height = 24 }: SVGProps) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5.5 11L10.5 16L19.5 7" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const APYIcon = ({ color = "#9C9C9C", width = 16, height = 16 }: SVGProps) => (
  <svg width={width} height={height} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8.00005 10.6676C8.00005 9.19421 9.19446 7.99981 10.6678 7.99981C9.19446 7.99981 8.00005 6.8054 8.00005 5.33203C8.00005 6.8054 6.80565 7.99981 5.33228 7.99981C6.80565 7.99981 8.00005 9.19421 8.00005 10.6676Z"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12.6267 5.37276C12.6267 4.26773 13.5225 3.37193 14.6275 3.37193C13.5225 3.37193 12.6267 2.47612 12.6267 1.37109C12.6267 2.47612 11.7309 3.37193 10.6259 3.37193C11.1565 3.37193 11.6654 3.58273 12.0407 3.95796C12.4159 4.33319 12.6267 4.84211 12.6267 5.37276V5.37276Z"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14.0026 7.33165V11.3333C14.0026 12.8067 12.8082 14.0011 11.3348 14.0011H4.66534C3.19196 14.0011 1.99756 12.8067 1.99756 11.3333V4.66387C1.99756 3.1905 3.19196 1.99609 4.66534 1.99609H8.667"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const AddCoinsIcon = ({ color = "#9C9C9C", width = 16, height = 16 }: SVGProps) => (
  <svg width={width} height={height} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M5.33333 11.9974C3.49267 11.9974 2 11.4007 2 10.6641"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M1.99984 5.33594V10.6693" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
    <path
      d="M7.3335 10C7.3335 10.7367 8.8255 11.3333 10.6668 11.3333C12.5082 11.3333 14.0002 10.7367 14.0002 10"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M8.66683 5.33594V7.0026" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M11.3335 3.33333H14.0002" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12.6668 4.66667V2" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M13.9998 10V12.6667" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7.33333 10V12.6667" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
    <path
      d="M14.0002 9.9974C14.0002 9.26073 12.5082 8.66406 10.6668 8.66406C8.8255 8.66406 7.3335 9.26073 7.3335 9.9974"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7.3335 12.6641C7.3335 13.4007 8.8255 13.9974 10.6668 13.9974C12.5082 13.9974 14.0002 13.4007 14.0002 12.6641"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5.33333 9.33333C3.49267 9.33333 2 8.73667 2 8"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <ellipse
      cx="5.33333"
      cy="5.33333"
      rx="3.33333"
      ry="1.33333"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const RotateArrowIcon = ({ color = "#9C9C9C", width = 16, height = 16 }: SVGProps) => (
  <svg width={width} height={height} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M8.39307 4.0026L9.7264 2.66927L8.39307 1.33594"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7.60628 12L6.27295 13.3333L7.60628 14.6667"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M11.7827 4.25C12.7393 5.214 13.3333 6.53733 13.3333 8.00267C13.3333 10.948 10.9453 13.336 8.00001 13.336C7.47601 13.336 6.97134 13.2573 6.49268 13.1167"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4.16917 11.7132C3.23984 10.7532 2.6665 9.44654 2.6665 8.00521C2.6665 5.05987 5.0545 2.67188 7.99984 2.67188C8.52384 2.67188 9.0285 2.75054 9.50717 2.89121"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const PlusIcon = ({ color = "#9C9C9C", width = 16, height = 16 }: SVGProps) => (
  <svg width={width} height={height} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 8H15" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 15V1" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const MinusIcon = ({ color = "#9C9C9C", width = 16, height = 2 }: SVGProps) => (
  <svg width={width} height={height} viewBox="0 0 16 2" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 1H15" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const RightArrowIcon = ({ color = "#9C9C9C", width = 24, height = 24 }: SVGProps) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g id="Group">
      <g id="Group_2">
        <path id="Path" d="M19 12H5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path
          id="Path_2"
          d="M14 17L19 12"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          id="Path_3"
          d="M14 7L19 12"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </g>
  </svg>
);

export interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

export const BurgerIcon = ({ size = 6, color = "#000000", ...props }: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke={color}
      width={size * 4}
      height={size * 4}
      className={cn(props.className)}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  );
};

export const CalendarIcon = ({ size = 6, color = "#9C9C9C", ...props }: IconProps) => {
  return (
    <svg
      width={size * 4}
      height={size * 4}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(props.className)}
    >
      <g id="Group">
        <path id="Path" d="M7.5 3V6" stroke={color} stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        <path
          id="Path_2"
          d="M16.5 3V6"
          stroke={color}
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          id="Path_3"
          d="M8.5 11.5H7.5"
          stroke={color}
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          id="Path_4"
          d="M8.5 15H7.5"
          stroke={color}
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          id="Path_5"
          d="M12.5 11.5H11.5"
          stroke={color}
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          id="Path_6"
          d="M12.5 15H11.5"
          stroke={color}
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          id="Path_7"
          d="M16.5 11.5H15.5"
          stroke={color}
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          id="Path_8"
          d="M16.5 15H15.5"
          stroke={color}
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <rect
          id="Rectangle"
          x="3"
          y="4.5"
          width="18"
          height="16.5"
          rx="3"
          stroke={color}
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </g>
    </svg>
  );
};

export const ClockIcon = ({ size = 6, color = "#9C9C9C", ...props }: IconProps) => {
  return (
    <svg
      width={size * 4}
      height={size * 4}
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(props.className)}
    >
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M7.50009 0.877014C3.84241 0.877014 0.877258 3.84216 0.877258 7.49984C0.877258 11.1575 3.8424 14.1227 7.50009 14.1227C11.1578 14.1227 14.1229 11.1575 14.1229 7.49984C14.1229 3.84216 11.1577 0.877014 7.50009 0.877014ZM1.82726 7.49984C1.82726 4.36683 4.36708 1.82701 7.50009 1.82701C10.6331 1.82701 13.1729 4.36683 13.1729 7.49984C13.1729 10.6328 10.6331 13.1727 7.50009 13.1727C4.36708 13.1727 1.82726 10.6328 1.82726 7.49984ZM8 4.50001C8 4.22387 7.77614 4.00001 7.5 4.00001C7.22386 4.00001 7 4.22387 7 4.50001V7.50001C7 7.63262 7.05268 7.7598 7.14645 7.85357L9.14645 9.85357C9.34171 10.0488 9.65829 10.0488 9.85355 9.85357C10.0488 9.65831 10.0488 9.34172 9.85355 9.14646L8 7.29291V4.50001Z"
        fill={color}
      />
    </svg>
  );
};

export const SearchIcon = ({ size = 6, color = "#9C9C9C", ...props }: IconProps) => {
  return (
    <svg
      width={size * 4}
      height={size * 4}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(props.className)}
    >
      <path
        id="Icon"
        d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z"
        stroke={color}
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
};
