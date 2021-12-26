import React, { useState } from "react";
import styles from "../styles/home.module.css";

const NodeIcon = () => {
  return (
    <svg viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="25" fill="#460442" stroke="#460442" />
    </svg>
  );
};

const EdgeIcon = () => {
  return (
    <svg viewBox="0 0 100 100">
      <line x1="20" y1="20" x2="80" y2="80" stroke="#810a6a" strokeWidth="10" />
      <circle cx="20" cy="20" r="15" fill="#460442" stroke="#460442" />
      <circle cx="80" cy="80" r="15" fill="#460442" stroke="#460442" />
    </svg>
  );
};

const TreeIcon = () => {
  return (
    <svg viewBox="0 0 100 100">
      <line x1="50" y1="20" x2="30" y2="50" stroke="#810a6a" strokeWidth="7" />
      <line x1="50" y1="20" x2="70" y2="50" stroke="#810a6a" strokeWidth="7" />
      <line x1="70" y1="50" x2="80" y2="80" stroke="#810a6a" strokeWidth="7" />
      <line x1="70" y1="50" x2="55" y2="80" stroke="#810a6a" strokeWidth="7" />
      <line x1="30" y1="50" x2="20" y2="80" stroke="#810a6a" strokeWidth="7" />
      <circle cx="50" cy="20" r="13" fill="#460442" />
      <circle cx="70" cy="50" r="11" fill="#460442" />
      <circle cx="30" cy="50" r="11" fill="#460442" />
      <circle cx="80" cy="80" r="10" fill="#460442" />
      <circle cx="55" cy="80" r="10" fill="#460442" />
      <circle cx="20" cy="80" r="10" fill="#460442" />
    </svg>
  );
};

const CanvasIcon = () => {
  return (
    <svg viewBox="0 0 100 100">
      <rect
        width="60"
        height="60"
        fill="none"
        strokeWidth="7"
        stroke="#460442"
        x="20"
        y="20"
        rx="7"
      />
      <line
        x1="30"
        y1="60"
        x2="40"
        y2="70"
        stroke="#460442"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="30"
        y1="50"
        x2="50"
        y2="70"
        stroke="#460442"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
};

const icons = [<NodeIcon />, <EdgeIcon />, <TreeIcon />, <CanvasIcon />];
const dropdownContent = [
  {
    title: "Nodes",
    options: [
      "Add Node",
      "Move Nodes",
      "Change Color",
      "Label Nodes",
      "Delete Nodes",
      "Set Root",
    ],
    icons: [null, null, null, null, null, null],
  },
  {
    title: "Edges",
    options: ["Link Nodes"],
    icons: [null],
  },
  {
    title: "Tree Operations",
    options: ["Verify Tree"],
    icons: [null],
  },
  {
    title: "Canvas Options",
    options: ["Resize Canvas"],
    icons: [null],
  },
];

const Navbar = (props) => {
  const [open, setOpen] = useState(-1);

  const NavItem = (props) => {
    const handleDropdown = (ind) => {
      setOpen(open === ind ? -1 : ind);

      const toMoveTo = document.getElementById(`navitem${ind}`);
      const dropdown = document.getElementById(`dropdownwindow`);
      const position = toMoveTo.getBoundingClientRect();
      dropdown.style.left = `${position.width + position.left + 2}px`;
      dropdown.style.top = `${position.top + 2}px`;
    };

    return (
      <li
        className={`${styles.navitem}`}
        id={`navitem${props.ind}`}
        ind={props.ind}
      >
        <a
          href="#"
          className={`${styles.iconbutton}`}
          onClick={() => handleDropdown(props.ind)}
        >
          {props.children}
        </a>
      </li>
    );
  };

  return (
    <nav className={`${styles.navbar}`}>
      <ul className={`${styles.navbarnav}`}>
        {icons.map((iconName, i) => {
          return (
            <NavItem key={`navitemcomponent${i}`} ind={i}>
              {iconName}
            </NavItem>
          );
        })}

        <div
          id="dropdownwindow"
          className={`${styles.dropdown} transition-all ${
            open === -1 ? `h-16` : `p-2`
          }`}
        >
          <p className="text-xs font-bold transition-all whitespace-nowrap self-center">
            {dropdownContent[open]?.title}
          </p>
          {dropdownContent[open]?.options.map((option, i) => {
            const onClickFunctionIndex = 0;
            for (let i = open - 1; i > -1; i--) {
              onClickFunctionIndex =
                onClickFunctionIndex + dropdownContent[i].options.length;
            }
            return (
              <a
                href="#"
                className={`${styles.dropdownitem} p-1 flex flex-row items-center justify-start`}
                key={`dropdownitem${i}`}
                onClick={props.handleClickEvents[onClickFunctionIndex + i]}
              >
                {dropdownContent[open]?.icons[i] && (
                  <span className={`${styles.iconbuttonsmall}`}>
                    {dropdownContent[open]?.icons[i]}
                  </span>
                )}
                <p className="text-sm whitespace-nowrap">{option}</p>
              </a>
            );
          })}
        </div>
      </ul>
    </nav>
  );
};

export default Navbar;
