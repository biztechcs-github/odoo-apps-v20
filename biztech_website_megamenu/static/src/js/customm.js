/** @odoo-module */

import { Component, onMounted } from "@odoo/owl";
import { registry } from "@web/core/registry";


console.log("\n thissssssssssssssssssssss")
class MegaMenuComponent extends Component {
    setup() {
        onMounted(() => {
            console.log("\n thisss function", this.initializeMegaMenu())
            this.initializeMegaMenu(); // Call your function
        });
    }

    initializeMegaMenu() {
        console.log("Initializing MegaMenu...");
        document.querySelectorAll('.mega-dropdown-menu').forEach(menu => {
            menu.addEventListener('click', e => e.stopPropagation());
        });
    }
}

// Register the component
registry.category("web.components").add("MegaMenuComponent", MegaMenuComponent);