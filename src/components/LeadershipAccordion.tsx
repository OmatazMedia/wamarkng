/**
 * Built by Omataz Media — Web Development & Design
 * Website   : https://www.omatazmedia.com.ng
 * Email     : hello@omatazmedia.com.ng
 * Phone     : +234 9024599289, +234 7037373304
 * WhatsApp  : https://wa.me/message/M3QUHNVONY6NK1
 * Social    : @omatazmedia — Facebook · Instagram · X · YouTube
 * GitHub    : https://github.com/omatazmedia
 * Contact   : Johnson Toluwani
 *
 * Our Management — leadership accordion (client-side expand/collapse),
 * matching the approved wamark- Mgt.jpg design: role header, caret, and
 * the full bio plus the named leader inside the expanding panel.
 */

"use client";

import { useState } from "react";

const leaders = [
  {
    role: "Chief Executive Officer (CEO)",
    name: "Engr Markson Ogbeide",
    text: "Provides strategic direction and oversight, driving innovation and growth across our core areas. Our CEO brings extensive experience in leadership and innovation, guiding our team towards achieving exceptional results.",
  },
  {
    role: "Chief Operations Officer (COO)",
    name: "Wasiu Agbaje",
    text: "Oversees day-to-day operations, ensuring seamless delivery of services in security, surveillance, and oil and gas. Our COO is responsible for implementing operational strategies that drive efficiency and effectiveness.",
  },
  {
    role: "Project Manager",
    name: "Gabriel Momoh",
    text: "Leads project planning and execution, ensuring timely and effective delivery of projects in our core areas. Our Project Manager is skilled in managing complex projects, ensuring client satisfaction and operational excellence.",
  },
  {
    role: "Operations Manager",
    name: "Babajide Hammed",
    text: "Manages and optimizes business operations, prioritizing client satisfaction and operational excellence. Our Operations Manager is responsible for streamlining processes, reducing costs, and improving overall efficiency.",
  },
];

export default function LeadershipAccordion() {
  // First accordion item open by default, matching the approved design.
  const [openIdx, setOpenIdx] = useState<number>(0);

  return (
    <div className="mgmt-accordion">
      {leaders.map((l, i) => {
        const open = openIdx === i;
        return (
          <div className={open ? "mgmt-item open" : "mgmt-item"} key={l.name}>
            <button
              className="mgmt-head"
              aria-expanded={open}
              aria-controls={`mgmt-panel-${i}`}
              onClick={() => setOpenIdx(open ? -1 : i)}
            >
              <span className="mgmt-role">{l.role}</span>
              <span className="mgmt-caret" aria-hidden="true" />
            </button>
            <div className="mgmt-panel" id={`mgmt-panel-${i}`} role="region">
              <div className="mgmt-panel-inner">
                <p className="mgmt-bio">{l.text}</p>
                <p className="mgmt-name">
                  <strong>{l.role.split(" (")[0]}:</strong> {l.name}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
