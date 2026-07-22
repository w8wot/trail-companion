# Trail Companion

Trail Companion is a source-available web application designed to simplify loaning equipment during off-road events, club rides, training classes, and other group activities.

Instead of manually tracking who borrowed radios or recovery gear, organizers generate a QR code for each item. Borrowers scan the code, enter their name, and the checkout is immediately recorded. The organizer's screen automatically resets and is ready for the next borrower.

---

## Features

- 📱 QR code equipment checkout
- 👤 Mobile-friendly borrower interface
- ☁️ Azure Functions backend
- 💾 Azure Table Storage
- 🔄 Automatic organizer updates
- 📋 Equipment return/check-in
- 🌐 GitHub Pages frontend
- 📱 Responsive design for phones, tablets, and desktops

---

## Current Workflow

### Organizer

1. Select a category
2. Enter the equipment description
3. Optionally enter an ID or inventory number
4. Generate a QR code

### Borrower

1. Scan the QR code
2. Enter their name
3. Submit the checkout

### System

- Checkout is stored in Azure
- Organizer display automatically clears the QR
- Equipment becomes available in the Return screen
- Item can later be checked back in

---

## Technology Stack

### Frontend

- React
- Vite
- QRCode.react

### Backend

- Azure Functions (Node.js)
- Azure Table Storage

### Hosting

- GitHub Pages
- Microsoft Azure

---

## Project Status

Current development focuses on creating a simple, reliable checkout system before expanding into inventory management and event features.

Implemented:

- ✅ QR checkout workflow
- ✅ Azure synchronization
- ✅ Automatic organizer refresh
- ✅ Equipment return/check-in
- ✅ Mobile-friendly interface

Planned:

- Event sessions
- Inventory management
- Checkout history
- Search and filtering
- Club customization
- Authentication
- Reporting
- Offline support

---

## Contributing

Suggestions, issues, and pull requests are welcome.

If you have ideas that would help volunteer organizations, off-road clubs, amateur radio groups, or other communities manage shared equipment, please open an issue.

---

## License

This project is licensed under the [PolyForm Noncommercial License 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0).
See the [LICENSE](LICENSE) file for the full terms.

In short: the source is available for anyone to view, learn from, and use
for noncommercial purposes (personal projects, education, nonprofits,
etc.). **Commercial use — including running Trail Companion for a club,
business, or organization, whether or not a fee is charged to
members — is not covered by this license** and requires a separate
commercial license.

Interested in a branded deployment for your club (custom name, colors,
and hosted setup)? Open an issue or reach out directly to discuss
licensing.
