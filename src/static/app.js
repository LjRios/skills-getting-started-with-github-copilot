document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and any previous options
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const participants = details.participants || [];
        const spotsLeft = details.max_participants - participants.length;
        const participantList = participants.length
          ? `<ul class="participants-list">${participants
              .map(
                (participant) => `
                  <li class="participant-pill">
                    <span class="participant-name">${participant}</span>
                    <button
                      type="button"
                      class="participant-remove"
                      data-activity="${name}"
                      data-email="${participant}"
                      aria-label="Remove ${participant} from ${name}"
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M9 3h6a1 1 0 0 1 1 1v1h4v2H4V5h4V4a1 1 0 0 1 1-1Zm-2 5h10l-1 12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L7 8Z" />
                      </svg>
                    </button>
                  </li>
                `
              )
              .join("")}</ul>`
          : '<p class="participants-empty">Be the first to sign up!</p>';

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> <span class="availability-value">${spotsLeft} spots left</span></p>
          <div class="participants-section">
            <h5>Participants</h5>
            ${participantList}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        activityCard.querySelectorAll(".participant-remove").forEach((button) => {
          button.addEventListener("click", async () => {
            const participantEmail = button.dataset.email;
            const activityName = button.dataset.activity;
            const pill = button.closest(".participant-pill");
            const availabilityValue = activityCard.querySelector(".availability-value");

            try {
              const response = await fetch(
                `/activities/${encodeURIComponent(activityName)}/unregister?email=${encodeURIComponent(participantEmail)}`,
                {
                  method: "DELETE",
                }
              );

              if (response.ok) {
                pill?.remove();

                const remainingParticipants = activityCard.querySelectorAll(".participant-pill").length;
                const maxParticipants = details.max_participants;

                if (availabilityValue) {
                  availabilityValue.textContent = `${maxParticipants - remainingParticipants} spots left`;
                }
              } else {
                console.error("Failed to unregister participant");
              }
            } catch (error) {
              console.error("Error unregistering participant:", error);
            }
          });
        });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        await fetchActivities();
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
