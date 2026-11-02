(function () {
  "use strict";

  const storage = {
    get: function (key, fallback) {
      try {
        const saved = localStorage.getItem(key);
        return saved === null ? fallback : JSON.parse(saved);
      } catch (error) {
        return fallback;
      }
    },
    set: function (key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        // Continue without persistence when browser storage is unavailable.
      }
    }
  };

  function dateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
  }

  function dateFromString(value) {
    const parts = value.split("-").map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2], 12);
  }

  function shiftDate(value, days) {
    const date = dateFromString(value);
    date.setDate(date.getDate() + days);
    return dateString(date);
  }

  function dayDifference(from, to) {
    return Math.round((dateFromString(to) - dateFromString(from)) / 86400000);
  }

  const today = dateString(new Date());
  const savedPlants = storage.get("sproutkeeperPlants", null);
  let plants = Array.isArray(savedPlants)
    ? savedPlants
    : SEED_PLANTS.map(function (plant) {
      const copy = Object.assign({}, plant);
      copy.lastWatered = shiftDate(today, -plant.daysSinceWatered);
      delete copy.daysSinceWatered;
      return copy;
    });
  let plan = storage.get("sproutkeeperPlan", "starter");
  const savedGroup = storage.get("sproutkeeperGroup", null);
  let group = savedGroup && Array.isArray(savedGroup.members) && Array.isArray(savedGroup.reminders)
    ? savedGroup
    : {
      name: SEED_GROUP.name,
      members: SEED_GROUP.members.slice(),
      reminders: SEED_GROUP.reminders.map(function (reminder) {
        const copy = Object.assign({}, reminder, { createdDate: shiftDate(today, -reminder.daysAgo) });
        delete copy.daysAgo;
        return copy;
      })
    };
  let activeFilter = "all";

  if (!Array.isArray(savedPlants)) {
    storage.set("sproutkeeperPlants", plants);
  }

  const list = document.getElementById("plant-list");
  const emptyState = document.getElementById("empty-state");
  const formPanel = document.getElementById("add-plant-panel");
  const addForm = document.getElementById("add-plant-form");
  const addButton = document.getElementById("add-plant-button");
  const todayLabel = document.getElementById("today-label");
  const planMessage = document.getElementById("plan-message");
  const formError = document.getElementById("form-error");
  const reminderList = document.getElementById("reminder-list");
  const reminderForm = document.getElementById("reminder-form");
  const memberList = document.getElementById("member-list");
  const reminderPlant = document.getElementById("reminder-plant");
  const reminderRecipient = document.getElementById("reminder-recipient");

  document.title = STARTUP.name + " | Plant care, on time";
  document.getElementById("brand-name").textContent = STARTUP.name;
  document.getElementById("tagline").textContent = STARTUP.tagline;
  todayLabel.textContent = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric"
  }).format(new Date());

  function statusFor(plant) {
    const dueDate = shiftDate(plant.lastWatered, Number(plant.intervalDays));
    const daysUntil = dayDifference(today, dueDate);
    if (daysUntil < 0) {
      return { kind: "overdue", label: "Overdue " + Math.abs(daysUntil) + "d" };
    }
    if (daysUntil === 0) {
      return { kind: "today", label: "Due today" };
    }
    return {
      kind: "upcoming",
      label: daysUntil === 1 ? "Tomorrow" : "In " + daysUntil + " days"
    };
  }

  function lastWateredLabel(value) {
    const daysAgo = dayDifference(value, today);
    if (daysAgo === 0) return "Today";
    if (daysAgo === 1) return "Yesterday";
    return daysAgo + " days ago";
  }

  function makePlantRow(plant) {
    const status = statusFor(plant);
    const row = document.createElement("article");
    row.className = "plant-row";

    const image = document.createElement("img");
    image.className = "plant-image";
    image.src = plant.image;
    image.alt = "";
    image.loading = "lazy";

    const details = document.createElement("div");
    details.className = "plant-details";
    const name = document.createElement("h3");
    name.textContent = plant.name;
    const variety = document.createElement("p");
    variety.className = "plant-variety";
    variety.textContent = plant.variety || "Houseplant";
    const location = document.createElement("p");
    location.className = "plant-location";
    location.textContent = plant.location || "No location";
    details.append(name, variety, location);

    const schedule = document.createElement("div");
    schedule.className = "plant-schedule";
    const scheduleLabel = document.createElement("span");
    scheduleLabel.className = "detail-label";
    scheduleLabel.textContent = "WATER EVERY";
    const interval = document.createElement("span");
    interval.textContent = plant.intervalDays + " days";
    schedule.append(scheduleLabel, interval);

    const lastWatered = document.createElement("div");
    lastWatered.className = "plant-last-watered";
    const lastLabel = document.createElement("span");
    lastLabel.className = "detail-label";
    lastLabel.textContent = "LAST WATERED";
    const lastDate = document.createElement("span");
    lastDate.textContent = lastWateredLabel(plant.lastWatered);
    lastWatered.append(lastLabel, lastDate);

    const action = document.createElement("div");
    action.className = "plant-action";
    const statusBadge = document.createElement("span");
    statusBadge.className = "status status-" + status.kind;
    statusBadge.textContent = status.label;
    const waterButton = document.createElement("button");
    waterButton.type = "button";
    waterButton.className = "water-button";
    waterButton.textContent = "Mark watered";
    waterButton.setAttribute("aria-label", "Mark " + plant.name + " as watered today");
    waterButton.addEventListener("click", function () {
      plants = plants.map(function (item) {
        return item.id === plant.id ? Object.assign({}, item, { lastWatered: today }) : item;
      });
      saveAndRender();
    });
    action.append(statusBadge, waterButton);

    row.append(image, details, schedule, lastWatered, action);
    return row;
  }

  function saveAndRender() {
    storage.set("sproutkeeperPlants", plants);
    render();
  }

  function saveGroupAndRender() {
    storage.set("sproutkeeperGroup", group);
    renderGroup();
  }

  function reminderTimeLabel(value) {
    const daysAgo = dayDifference(value, today);
    if (daysAgo <= 0) return "Today";
    if (daysAgo === 1) return "Yesterday";
    return daysAgo + " days ago";
  }

  function makeReminderRow(reminder) {
    const row = document.createElement("article");
    row.className = "reminder-row";
    const content = document.createElement("div");
    content.className = "reminder-content";

    const heading = document.createElement("div");
    heading.className = "reminder-heading";
    const title = document.createElement("h3");
    title.textContent = reminder.from + " reminded " + reminder.to;
    const time = document.createElement("span");
    time.className = "reminder-time";
    time.textContent = reminderTimeLabel(reminder.createdDate);
    heading.append(title, time);

    const plant = plants.find(function (item) { return item.id === reminder.plantId; });
    const subject = document.createElement("p");
    subject.className = "reminder-plant-name";
    subject.textContent = plant ? plant.name : "Plant removed";
    const message = document.createElement("p");
    message.className = "reminder-message";
    message.textContent = reminder.message;
    content.append(heading, subject, message);

    const action = document.createElement("div");
    action.className = "reminder-action";
    const status = document.createElement("span");
    status.className = "reminder-status reminder-status-" + reminder.status;
    status.textContent = reminder.status === "done" ? "Cared for" : "Needs a check";
    action.append(status);
    if (reminder.status !== "done" && plant) {
      const doneButton = document.createElement("button");
      doneButton.type = "button";
      doneButton.className = "text-button reminder-done";
      doneButton.textContent = "Mark watered";
      doneButton.addEventListener("click", function () {
        plants = plants.map(function (item) {
          return item.id === plant.id ? Object.assign({}, item, { lastWatered: today }) : item;
        });
        group.reminders = group.reminders.map(function (item) {
          return item.id === reminder.id ? Object.assign({}, item, { status: "done" }) : item;
        });
        storage.set("sproutkeeperPlants", plants);
        storage.set("sproutkeeperGroup", group);
        render();
        renderGroup();
      });
      action.append(doneButton);
    }
    row.append(content, action);
    return row;
  }

  function renderGroup() {
    document.getElementById("group-name").textContent = group.name;
    document.getElementById("group-member-count").textContent = group.members.length;
    memberList.replaceChildren.apply(memberList, group.members.map(function (member, index) {
      const item = document.createElement("li");
      item.className = "member-item";
      const avatar = document.createElement("span");
      avatar.className = "member-avatar member-avatar-" + (index % 4);
      avatar.setAttribute("aria-hidden", "true");
      avatar.textContent = member.slice(0, 1).toUpperCase();
      const name = document.createElement("span");
      name.textContent = member;
      item.append(avatar, name);
      return item;
    }));

    reminderRecipient.replaceChildren.apply(reminderRecipient, group.members
      .filter(function (member) { return member !== "You"; })
      .map(function (member) {
        const option = document.createElement("option");
        option.value = member;
        option.textContent = member;
        return option;
      }));
    reminderPlant.replaceChildren.apply(reminderPlant, plants.map(function (plant) {
      const option = document.createElement("option");
      option.value = plant.id;
      option.textContent = plant.name;
      return option;
    }));

    const sortedReminders = group.reminders.slice().sort(function (first, second) {
      return second.createdDate.localeCompare(first.createdDate);
    });
    reminderList.replaceChildren.apply(reminderList, sortedReminders.map(makeReminderRow));
    document.getElementById("group-empty").hidden = sortedReminders.length > 0;
    document.getElementById("reminder-submit").disabled = plants.length === 0 || group.members.length < 2;
  }

  function render() {
    const statuses = plants.map(function (plant) {
      return { plant: plant, status: statusFor(plant) };
    });
    const needsWater = statuses.filter(function (item) {
      return item.status.kind === "overdue" || item.status.kind === "today";
    }).length;
    const dueToday = statuses.filter(function (item) {
      return item.status.kind === "today";
    }).length;

    document.getElementById("plants-count").textContent = plants.length;
    document.getElementById("needs-water-count").textContent = needsWater;
    document.getElementById("due-today-count").textContent = dueToday;
    document.getElementById("current-plan").textContent = plan === "plus"
      ? "Plus subscription active in this demo"
      : "Starter plan · " + Math.max(0, 5 - plants.length) + " plant slots left";
    document.getElementById("starter-plan-button").textContent = plan === "starter" ? "Current plan" : "Switch to Starter";
    document.getElementById("plus-plan-button").textContent = plan === "plus" ? "Plus active" : "Start Plus · $3.99/month";
    document.getElementById("starter-plan-button").disabled = plan === "starter";
    document.getElementById("plus-plan-button").disabled = plan === "plus";

    const visiblePlants = statuses.filter(function (item) {
      if (activeFilter === "needs-water") {
        return item.status.kind === "overdue" || item.status.kind === "today";
      }
      if (activeFilter === "upcoming") return item.status.kind === "upcoming";
      return true;
    });

    list.replaceChildren.apply(list, visiblePlants.map(function (item) {
      return makePlantRow(item.plant);
    }));
    renderGroup();
    emptyState.hidden = visiblePlants.length > 0;
    if (plants.length === 0) {
      emptyState.textContent = "Your garden is ready for its first plant. Add one to get started.";
    } else if (activeFilter === "needs-water") {
      emptyState.textContent = "Nothing needs water right now. Your plants are on track.";
    } else if (activeFilter === "upcoming") {
      emptyState.textContent = "No upcoming watering reminders.";
    } else {
      emptyState.textContent = "No plants to show. Add a plant to start your schedule.";
    }
  }

  document.querySelectorAll("[data-filter]").forEach(function (button) {
    button.addEventListener("click", function () {
      activeFilter = button.getAttribute("data-filter");
      document.querySelectorAll("[data-filter]").forEach(function (filterButton) {
        filterButton.setAttribute("aria-pressed", filterButton === button ? "true" : "false");
      });
      render();
    });
  });

  addButton.addEventListener("click", function () {
    formPanel.hidden = !formPanel.hidden;
    addButton.setAttribute("aria-expanded", formPanel.hidden ? "false" : "true");
    if (!formPanel.hidden) document.getElementById("plant-name").focus();
  });

  document.getElementById("cancel-add").addEventListener("click", function () {
    formPanel.hidden = true;
    addButton.setAttribute("aria-expanded", "false");
    addForm.reset();
    formError.hidden = true;
    addButton.focus();
  });

  document.getElementById("starter-plan-button").addEventListener("click", function () {
    plan = "starter";
    storage.set("sproutkeeperPlan", plan);
    planMessage.textContent = "Starter is selected. Your existing plants are still saved; adding plants is limited to five.";
    render();
  });

  document.getElementById("plus-plan-button").addEventListener("click", function () {
    plan = "plus";
    storage.set("sproutkeeperPlan", plan);
    planMessage.textContent = "Plus is active in this demo. No payment was collected.";
    render();
  });

  addForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const formData = new FormData(addForm);
    const name = String(formData.get("name")).trim();
    const variety = String(formData.get("variety")).trim();
    const location = String(formData.get("location")).trim();
    const intervalDays = Number(formData.get("intervalDays"));
    if (!name || !Number.isInteger(intervalDays) || intervalDays < 1 || intervalDays > 365) return;
    if (plan === "starter" && plants.length >= 5) {
      formError.hidden = false;
      return;
    }

    plants.unshift({
      id: "plant-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      name: name,
      variety: variety || "Houseplant",
      location: location || "No location",
      intervalDays: intervalDays,
      lastWatered: today,
      image: SEED_PLANTS[0].image
    });
    activeFilter = "all";
    document.querySelector('[data-filter="all"]').click();
    formPanel.hidden = true;
    addButton.setAttribute("aria-expanded", "false");
    addForm.reset();
    formError.hidden = true;
    saveAndRender();
    addButton.focus();
  });

  reminderForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const formData = new FormData(reminderForm);
    const plantId = String(formData.get("plantId"));
    const recipient = String(formData.get("recipient"));
    const message = String(formData.get("message")).trim();
    if (!plants.some(function (plant) { return plant.id === plantId; }) || !recipient || !message) return;
    group.reminders.unshift({
      id: "reminder-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      from: "You",
      to: recipient,
      plantId: plantId,
      message: message,
      createdDate: today,
      status: "pending"
    });
    reminderForm.reset();
    saveGroupAndRender();
  });

  document.getElementById("member-form").addEventListener("submit", function (event) {
    event.preventDefault();
    const nameInput = document.getElementById("member-name");
    const name = nameInput.value.trim();
    const exists = group.members.some(function (member) {
      return member.toLowerCase() === name.toLowerCase();
    });
    if (!name || exists) {
      document.getElementById("member-feedback").textContent = exists ? "That member is already in this group." : "Enter a name to add a member.";
      return;
    }
    group.members.push(name);
    nameInput.value = "";
    document.getElementById("member-feedback").textContent = name + " added to this demo group.";
    saveGroupAndRender();
  });

  render();
})();