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
        <path id="Path" d="M7.5 3V6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path id="Path_2" d="M16.5 3V6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path
          id="Path_3"
          d="M8.5 11.5H7.5"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          id="Path_4"
          d="M8.5 15H7.5"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          id="Path_5"
          d="M12.5 11.5H11.5"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          id="Path_6"
          d="M12.5 15H11.5"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          id="Path_7"
          d="M16.5 11.5H15.5"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          id="Path_8"
          d="M16.5 15H15.5"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect
          id="Rectangle"
          x="3"
          y="4.5"
          width="18"
          height="16.5"
          rx="3"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
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
        fillRule="evenodd"
        clipRule="evenodd"
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
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const LightningIcon = ({ color = "#404040", width = 11, height = 16, className }: SVGProps) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 11 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M6.69668 0.540354C6.9086 0.631038 7.03107 0.854857 6.99317 1.08223L6.09021 6.50001H10.5C10.6893 6.50001 10.8625 6.60701 10.9472 6.77641C11.0319 6.9458 11.0136 7.1485 10.8999 7.30001L4.89998 15.3C4.76168 15.4844 4.51522 15.5503 4.30329 15.4597C4.09136 15.369 3.96889 15.1452 4.00679 14.9178L4.90975 9.5H0.499998C0.310618 9.5 0.137488 9.393 0.0527876 9.22361C-0.0319024 9.05422 -0.0136324 8.85151 0.0999976 8.7L6.09998 0.700038C6.23829 0.515625 6.48475 0.44967 6.69668 0.540354ZM1.5 8.50001H5.49998C5.64696 8.50001 5.78649 8.56467 5.88149 8.67682C5.97649 8.78896 6.01734 8.93723 5.99318 9.0822L5.33028 13.0596L9.50001 7.50001H5.49998C5.35301 7.50001 5.21348 7.43534 5.11847 7.3232C5.02347 7.21105 4.98262 7.06279 5.00679 6.91781L5.66969 2.94042L1.5 8.50001Z"
      fill={color}
    />
  </svg>
);

export const WarningIcon = ({ color = "#FF0000", width = 24, height = 21, className }: SVGProps) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 21"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M13.5126 0.972217C12.8301 -0.173031 11.1715 -0.173031 10.4889 0.972219L0.258666 18.1371C-0.440537 19.3102 0.404786 20.7982 1.77051 20.7982H22.231C23.5968 20.7982 24.4421 19.3102 23.7429 18.1371L13.5126 0.972217ZM11.8633 1.79136C11.9254 1.68725 12.0762 1.68725 12.1382 1.79136L22.3685 18.9563C22.4321 19.0628 22.3552 19.1982 22.231 19.1982H1.77051C1.64637 19.1982 1.56951 19.0628 1.63307 18.9563L11.8633 1.79136ZM10.9238 7.17597C10.9003 6.56496 11.3893 6.0568 12.0008 6.0568C12.6123 6.0568 13.1012 6.56496 13.0777 7.17599L12.8315 13.5774C12.8143 14.0238 12.4475 14.3768 12.0008 14.3768C11.5541 14.3768 11.1872 14.0238 11.17 13.5774L10.9238 7.17597ZM13.2006 16.7598C13.2006 17.4225 12.6633 17.9598 12.0006 17.9598C11.3379 17.9598 10.8006 17.4225 10.8006 16.7598C10.8006 16.0971 11.3379 15.5598 12.0006 15.5598C12.6633 15.5598 13.2006 16.0971 13.2006 16.7598Z"
      fill={color}
    />
  </svg>
);

export const DiagonalRightArrowIcon = ({ color = "#9C9C9C", width = 24, height = 25, className }: SVGProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={width}
    height={height}
    viewBox="0 0 24 25"
    fill="none"
    className={className}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5.83589 18.9419C5.52345 18.6295 5.52345 18.1229 5.83589 17.8106L16.4702 7.17617H9.60157C9.15974 7.17617 8.80157 6.818 8.80157 6.37617C8.80157 5.93435 9.15974 5.57617 9.60157 5.57617H18.4016C18.6137 5.57617 18.8172 5.66046 18.9673 5.81049C19.1172 5.96052 19.2016 6.164 19.2016 6.37617V15.1762C19.2016 15.618 18.8433 15.9762 18.4016 15.9762C17.9598 15.9762 17.6016 15.618 17.6016 15.1762V8.30755L6.96725 18.9419C6.65483 19.2543 6.1483 19.2543 5.83589 18.9419Z"
      fill={color}
    />
  </svg>
);

export const PintoLogo = ({ width = 110, height = 71, color = "#387F5C", className }: SVGProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={width}
    height={height}
    viewBox="0 0 110 71"
    fill="none"
    className={className}
  >
    <path
      d="M61.8419 2.99513C61.9921 4.73812 58.7266 6.14055 54.5493 6.14055C50.372 6.14055 47.106 4.73812 47.2562 2.99513C47.3965 1.34229 50.6625 0 54.5493 0C58.4361 0 61.6916 1.34229 61.8419 2.99513Z"
      fill={color}
    />
    <path
      d="M42.4598 3.64723C44.303 5.11976 42.7806 7.19333 38.9639 8.29522C35.037 9.42717 30.4385 9.09658 28.7756 7.52388C27.1928 6.03132 29.0064 3.95778 32.743 2.91599C36.3894 1.90425 40.6967 2.2348 42.4598 3.64723Z"
      fill={color}
    />
    <path
      d="M24.5976 9.45605C28.0237 10.2174 28.6448 12.5013 25.8699 14.6049C22.9448 16.8187 17.5853 17.9807 14.0391 17.1392C10.593 16.3278 10.3628 13.8836 13.4081 11.75C16.3032 9.71648 21.2721 8.71478 24.6079 9.45605H24.5976Z"
      fill={color}
    />
    <path
      d="M11.3942 20.2835C16.1325 19.7827 19.2677 21.6358 18.3762 24.4607C17.4245 27.4758 12.4357 30.471 7.27662 31.0921C2.11758 31.7131 -0.907516 29.6195 0.484927 26.4741C1.78721 23.5291 6.65589 20.7844 11.3942 20.2835Z"
      fill={color}
    />
    <path
      d="M7.45761 35.0087C12.6267 32.6647 18.2263 33.1555 20.0696 36.0605C22.033 39.1658 19.2483 43.8639 13.7386 46.6086C8.00859 49.4636 1.97792 48.9627 0.365091 45.4166C-1.12753 42.1109 2.09821 37.4329 7.45761 35.0087Z"
      fill={color}
    />
    <path
      d="M17.8555 50.1242C21.6221 45.7867 28.3942 43.9636 33.0824 45.907C37.981 47.9304 39.183 53.2896 35.6568 58.0578C31.8301 63.2067 24.4771 65.5306 19.3181 63.0363C14.3994 60.6523 13.7884 54.7922 17.8555 50.1242Z"
      fill={color}
    />
    <path
      d="M42.9789 59.5118C43.2895 54.0725 48.4686 49.8352 54.5593 49.8452C60.65 49.8452 65.8291 54.0725 66.1397 59.5118C66.4702 65.4721 61.2811 70.5307 54.5593 70.5307C47.8375 70.5307 42.6483 65.4821 42.9789 59.5118Z"
      fill={color}
    />
    <path
      d="M73.4527 58.0578C69.9265 53.2896 71.1189 47.9304 76.0275 45.907C80.7258 43.9636 87.4874 45.7867 91.254 50.1242C95.3111 54.7922 94.7 60.6623 89.7914 63.0363C84.6324 65.5306 77.2794 63.2067 73.4527 58.0578Z"
      fill={color}
    />
    <path
      d="M95.3712 46.6087C89.8615 43.8639 87.0763 39.1558 89.0397 36.0605C90.883 33.1555 96.4726 32.6647 101.652 35.0087C107.021 37.4329 110.237 42.1109 108.744 45.4166C107.141 48.9627 101.111 49.4736 95.3712 46.6087Z"
      fill={color}
    />
    <path
      d="M101.832 31.1038C96.6734 30.4827 91.6846 27.4876 90.7329 24.4724C89.8414 21.6476 92.9771 19.7944 97.7154 20.2953C102.454 20.7861 107.322 23.5408 108.625 26.4859C110.017 29.6313 106.992 31.7249 101.832 31.1038Z"
      fill={color}
    />
    <path
      d="M95.0715 17.1392C91.5153 17.9807 86.1658 16.8187 83.2407 14.6049C80.4558 12.5013 81.0769 10.2174 84.513 9.45605C87.8488 8.71478 92.8077 9.71648 95.7128 11.75C98.7581 13.8836 98.5278 16.3278 95.0818 17.1392H95.0715Z"
      fill={color}
    />
    <path
      d="M80.3337 7.51298C78.6708 9.07567 74.0728 9.41627 70.1459 8.28433C66.3292 7.18244 64.8063 5.10886 66.6496 3.63633C68.4127 2.22391 72.7204 1.89336 76.3668 2.9051C80.1034 3.94689 81.9165 6.02042 80.3337 7.51298Z"
      fill={color}
    />
    <path
      d="M62.5241 10.7284C62.7044 12.8921 59.1382 14.6551 54.5502 14.6551C49.9621 14.6551 46.3954 12.8921 46.5757 10.7284C46.746 8.68488 50.3127 7.03204 54.5502 7.03204C58.7876 7.03204 62.3538 8.68488 62.5241 10.7284Z"
      fill={color}
    />
    <path
      d="M44.5623 11.1581C47.5876 12.6206 47.3671 15.2351 43.941 17.0182C40.3648 18.8814 34.9255 19.1118 31.9302 17.509C29.0552 15.9764 29.7064 13.3018 33.2426 11.5889C36.6386 9.93603 41.6572 9.75573 44.5623 11.1581Z"
      fill={color}
    />
    <path
      d="M30.797 18.7025C35.5454 18.422 39.0919 20.4055 38.6912 23.1602C38.2605 26.1052 33.7021 28.7999 28.523 29.1405C23.3439 29.4811 19.8683 27.2773 20.7398 24.2621C21.5513 21.4373 26.0487 18.963 30.797 18.6925V18.7025Z"
      fill={color}
    />
    <path
      d="M29.1958 30.5532C33.283 28.0089 39.2534 27.7384 42.6594 29.9221C46.2457 32.2161 45.9248 36.3532 41.7975 39.2081C37.4399 42.2233 30.9088 42.5839 27.3626 39.9494C24.0067 37.4551 24.8883 33.2278 29.1958 30.5532Z"
      fill={color}
    />
    <path
      d="M44.2822 39.8785C44.5427 35.9918 49.1408 32.9265 54.5503 32.9265C59.9597 32.9265 64.5578 35.9918 64.8183 39.8785C65.0988 44.0757 60.5007 47.5717 54.5503 47.5717C48.5998 47.5717 44.0018 44.0757 44.2822 39.8785Z"
      fill={color}
    />
    <path
      d="M67.3024 39.2081C63.1751 36.3532 62.8542 32.2161 66.4405 29.9221C69.8465 27.7384 75.8169 28.0089 79.9041 30.5532C84.2116 33.2278 85.0932 37.4651 81.7374 39.9494C78.1911 42.5739 71.66 42.2233 67.3024 39.2081Z"
      fill={color}
    />
    <path
      d="M80.5764 29.1405C75.3973 28.7999 70.8389 26.1052 70.4082 23.1602C70.0075 20.4055 73.544 18.422 78.3024 18.7025C83.0507 18.973 87.5486 21.4472 88.3601 24.2721C89.2316 27.2873 85.7555 29.491 80.5764 29.1504V29.1405Z"
      fill={color}
    />
    <path
      d="M77.1803 17.5095C74.185 19.1123 68.7453 18.8819 65.169 17.0187C61.743 15.2357 61.523 12.6212 64.5483 11.1587C67.4534 9.75627 72.4619 9.92655 75.8679 11.5894C79.4041 13.3124 80.0553 15.9769 77.1803 17.5095Z"
      fill={color}
    />
  </svg>
);

export const PintoLogoText = ({ width = 221, height = 73, color = "#387F5C", className }: SVGProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={width}
    height={height}
    viewBox="0 0 221 73"
    fill="none"
    className={className}
  >
    <path
      d="M191.89 57.4834C174.609 57.4834 163.261 48.616 163.261 35.0139V34.9337C163.261 21.2914 174.609 12.424 191.89 12.424C209.211 12.424 220.518 21.2914 220.518 34.9337V35.0139C220.518 48.616 209.211 57.4834 191.89 57.4834ZM191.89 51.2241C203.518 51.2241 212.138 45.2857 212.138 35.0139V34.9337C212.138 24.6217 203.518 18.6834 191.89 18.6834C180.302 18.6834 171.641 24.6217 171.641 34.9337V35.0139C171.641 45.2857 180.302 51.2241 191.89 51.2241Z"
      fill={color}
    />
    <path
      d="M152.793 56.3495C141.327 56.3495 137.078 52.9404 137.078 41.4699V19.9327V13.5557V0H144.935V13.5557H160.691V19.9327H144.935V40.3068C144.935 48.2078 147.1 49.9725 154.637 49.9725H160.25V56.3495H152.793Z"
      fill={color}
    />
    <path
      d="M79.8713 56.349V13.5569H87.7308V20.3748C90.7783 15.883 96.9134 12.4741 106.818 12.4741C120.572 12.4741 128.913 19.2518 128.913 32.5266V56.349H121.053V34.1709C121.053 23.904 114.958 18.8508 104.372 18.8508C93.8659 18.8508 87.7308 24.0644 87.7308 34.3313V56.349H79.8713Z"
      fill={color}
    />
    <path
      d="M62.3819 56.3495V13.5586H70.2446V56.3495H62.3819ZM62.3819 7.62331V0H70.2446V7.62331H62.3819Z"
      fill={color}
    />
    <path
      d="M28.7313 57.4717C18.2288 57.4717 11.3741 53.8221 7.96682 49.2903V72.1501H0.110001V13.5569H7.96682V20.6153C11.3741 16.0835 18.2288 12.4741 28.7313 12.4741C43.2423 12.4741 54.9474 20.6554 54.9474 34.9328V35.013C54.9474 49.2903 43.2423 57.4717 28.7313 57.4717ZM27.0477 51.2153C36.7484 51.2153 46.5695 46.5231 46.5695 35.013V34.9328C46.5695 23.4227 36.7484 18.7304 27.0477 18.7304C17.4271 18.7304 7.52588 23.4628 7.52588 34.9328V35.013C7.52588 46.4429 17.4271 51.2153 27.0477 51.2153Z"
      fill={color}
    />
  </svg>
);
