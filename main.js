export class UiManager {
    constructor(element, uiJsonObj, cssLib = "daisyui") {
      this.rootElement = element;
      this.uiJsonObj = uiJsonObj;
      this.uiState = {};
      this.selectedKeys = new Set();
      this.cssLib = cssLib;
      this.setDefaultUiState(uiJsonObj);
    }
  
    tag(name, attributes = {}, content = "") {
      const attrs = Object.entries(attributes)
        .map(([key, value]) => `${key}="${value}"`)
        .join(" ");
      return `<${name} ${attrs}>${content}</${name}>`;
    }
  
    makeTitleFromKey(key) {
      return key.charAt(0).toUpperCase() + key.slice(1);
    }
  
    render() {
      this.rootElement.innerHTML = this.renderUi();
      this.addEventListeners();
    }
  
    renderUi() {
      const elements = Object.keys(this.uiJsonObj)
        .map((key) => this.renderElement(key))
        .join("");
      if (this.cssLib === "daisyui") {
        return this.tag(
          "div",
          { class: "ui-manager card bg-base-100 w-96 shadow-xl" },
          this.tag("div", { class: "card-body" }, elements),
        );
      } else if (this.cssLib === "bootstrap") {
        return this.tag(
          "div",
          { class: "accordion p-4 m-3", id: "accordionExample" },
          elements,
        );
      }
    }
  
    renderElement(key) {
      if (!this.uiJsonObj[key]) {
        return "";
      }
  
      const isChecked = this.selectedKeys.has(key);
      const inputAttributes = {
        type: "checkbox",
        name: `Ui-${key}`,
        checked: isChecked ? "checked" : "",
        class:
          this.cssLib === "daisyui"
            ? "Ui-json checkbox checkbox-success"
            : "form-check-input",
      };
  
      if (this.cssLib === "daisyui") {
        return this.tag(
          "div",
          { class: "collapse collapse-plus border-base-300 bg-base-200 border" },
          `${this.tag(
            "div",
            { class: "collapse-title text-xl font-medium" },
            // this.tag("input", inputAttributes, "") +
            " " + this.makeTitleFromKey(key),
          )}` +
            `${this.tag(
              "div",
              { class: "collapse-content" },
              this.renderSubElements(key, this.uiJsonObj[key]),
            )}`,
        );
      } else if (this.cssLib === "bootstrap") {
        return this.tag(
          "div",
          { class: "accordion-item" },
          `${this.tag(
            "h2",
            { class: "accordion-header" },
            this.tag(
              "button",
              {
                class: "accordion-button collapsed",
                type: "button",
                "data-bs-toggle": "collapse",
                "data-bs-target": `#Ui-${key}`,
                "aria-expanded": "false",
                "aria-controls": `Ui-${key}`,
              },
              // this.tag("input", inputAttributes, "") +
              " " + this.makeTitleFromKey(key),
            ),
          )}` +
            `${this.tag(
              "div",
              {
                id: `Ui-${key}`,
                class: "accordion-collapse collapse",
                "data-bs-parent": "#accordionExample",
              },
              this.tag(
                "div",
                { class: "accordion-body" },
                this.renderSubElements(key, this.uiJsonObj[key]),
              ),
            )}`,
        );
      }
    }
  
    renderSubElements(rootElement, subElements) {
      if (this.cssLib === "daisyui") {
        const inputAttributes = {
          type: "checkbox",
          class: "checkbox checkbox-success",
        };
  
        return Object.keys(subElements)
          .map((elm) => {
            inputAttributes.name = `Ui-${rootElement}-${elm}`;
            inputAttributes.checked = this.selectedKeys.has(
              `${rootElement}-${elm}`,
            )
              ? "checked"
              : "";
            return this.tag(
              "div",
              { class: "form-control" },
              this.tag(
                "label",
                { class: "cursor-pointer label" },
                this.tag("input", inputAttributes) +
                  " " +
                  this.tag("span", { class: "label-text" }, subElements[elm]),
              ),
            );
          })
          .join("");
      } else if (this.cssLib === "bootstrap") {
        return Object.keys(subElements)
          .map((elm) => {
            const inputAttributes = {
              type: "checkbox",
              name: `Ui-${rootElement}-${elm}`,
              checked: this.selectedKeys.has(`${rootElement}-${elm}`)
                ? "checked"
                : "",
              class: "form-check-input",
            };
            return this.tag(
              "div",
              { class: "form-check" },
              this.tag(
                "label",
                { class: "form-check-label" },
                this.tag("input", inputAttributes, "") +
                  " " +
                  this.tag("span", {}, subElements[elm]),
              ),
            );
          })
          .join("");
      }
    }
  
    addEventListeners() {
      const checkboxes = this.rootElement.querySelectorAll(
        'input[type="checkbox"]',
      );
      checkboxes.forEach((checkbox) => {
        checkbox.addEventListener("change", (event) => {
          const key = event.target.name.split("-").slice(1).join("-");
          if (event.target.checked) {
            this.selectedKeys.add(key);
            this.updateUiState(key, true);
          } else {
            this.selectedKeys.delete(key);
            this.updateUiState(key, false);
          }
        });
      });
      const collapseTitles =
        this.rootElement.querySelectorAll(".accordion-button");
      collapseTitles.forEach((title) => {
        title.addEventListener("click", (event) => {
          event.target.parentElement.classList.toggle("collapsed");
        });
      });
    }
  
    updateUiState(key, value) {
      const parts = key.split("-");
      let currentObj = this.uiState;
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!currentObj[part]) {
          currentObj[part] = {};
        }
        currentObj = currentObj[part];
      }
      currentObj[parts[parts.length - 1]] = value;
      // Convert uiState to JSON if necessary
      this.uiState = JSON.parse(JSON.stringify(this.uiState));
    }
  
    getUiState() {
      return this.uiState;
    }
  
    setDefaultUiState(uiJsonObj) {
      const traverse = (obj, currentKey = "") => {
        for (const key in obj) {
          const newKey = currentKey ? `${currentKey}-${key}` : key;
          if (typeof obj[key] === "object") {
            this.uiState[newKey] = {};
            traverse(obj[key], newKey);
          } else {
            if (newKey.includes("-")) {
              const parts = newKey.split("-");
              const lastPart = parts.pop();
              const parentKey = parts.join("-");
              if (!this.uiState[parentKey]) {
                this.uiState[parentKey] = {};
              }
              this.uiState[parentKey][lastPart] = obj[key];
              continue;
            } else {
              this.uiState[newKey] = obj[key];
            }
          }
        }
      };
      traverse(uiJsonObj);
    }
  
    getStateJson() {
      // repair state , break netbanking-AXIS into netbanking[AXIS]
      const state = JSON.parse(JSON.stringify(this.uiState));
  
      const traverse = (obj) => {
        for (const key in obj) {
          const parts = key.split("-");
          if (parts.length > 1) {
            const lastPart = parts.pop();
            const newKey = parts.join("-");
            if (!obj[newKey]) {
              obj[newKey] = {};
            }
            obj[newKey][lastPart] = obj[key];
            delete obj[key];
          }
        }
        for (const key in obj) {
          if (typeof obj[key] === "object") {
            traverse(obj[key]);
          }
        }
      };
  
      traverse(state);
  
      return state;
    }
  }
  