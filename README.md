# bridge_dot_one

<div align="center">

```text
 b r i d g e _ d o t _ o n e

 [ localhost :: 11434 ]
```

![alt text](https://img.shields.io/badge/port-11434-success?style=flat-square)

![alt text](https://img.shields.io/badge/protocol-offline-lightgrey?style=flat-square)

![alt text](https://img.shields.io/badge/access-community-blue?style=flat-square)

[![VS Code Marketplace](https://img.shields.io/badge/VS%20Code-Marketplace-blue?logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=postboxen.bridge-dot-one)

**Deploy Empathy to Production.**

</div>

## 1.0 / SYNOPSIS

`bridge_dot_one` is a local translation layer for your terminal-brain.

It intercepts raw input via VS Code and recompiles it into human-readable communication protocols.

**No cloud. No leaks. Just stdio for social interactions.**

## 2.0 / THE PROBLEM

You are six layers deep in a recursive stack trace. You are in **The Zone**.

Then, a Junior PM pings you: *"Hey, how do I run the build script again?"*

Your kernel panics. Your brain wants to type:

> "RTFM and stop interrupting my flow before I rm -rf your access."

But you can't. You have to spend 15 minutes context-switching, breathing into a paper bag, and formulating a "helpful" response to avoid a meeting with HR.

**We built `bridge_dot_one` because we hate that 15 minutes.**

## 3.0 / EXECUTION EXAMPLES

`bridge_dot_one` doesn't care about your tone. It cares about your intent.

It handles English rage and Nordic "Swenglish" cynicism equally well.

### Case A: The English Rant

**Input (Raw):**
```
This code is absolute garbage. Who the fck merged this? It breaks the entire auth layer. I'm reverting this sht immediately.
```

**Output (Compiled):**
```
The recent merge has introduced critical instability within the authentication layer. To restore system integrity, I am initiating an immediate revert of these changes.
```

### Case B: The Swedish Burnout

**Input (Raw):**
```
Vem fan designade den här tabellen? Den saknar index och sänker hela prod så fort vi får trafik. Jag måste sitta hela helgen och skriva om skiten för att ni inte fattar vad prestanda är.
```

**Output (Compiled):**
```
### Status Update

> **Summary**

> A significant performance issue has been identified in the Database Schema due to the absence of indexes, which is impacting production stability as soon as traffic increases.

**Context**

The current configuration is compromising production stability under load. To restore system integrity, a refactoring of the schema is required.

**Next Steps**

- I will be dedicating my weekend to refactoring the Database Schema to ensure we meet our performance requirements.

- Verify stability in staging before deployment.
```

## 4.0 / PRIVACY PROTOCOL

**We don't trust the cloud.**

`bridge_dot_one` is 100% offline.

- **Localhost Only:** Communicates exclusively with `127.0.0.1`.
- **No Telemetry:** We don't want your data. We don't even have a server.
- **Air-Gap Ready:** Pull the ethernet cable. It still works.

## 5.0 / INITIALIZATION

### 5.1 Prerequisites

You need the engine. We recommend Ollama.

```bash
# 1. Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# 2. Pull the model (Mistral recommended)
ollama pull mistral
```

### 5.2 Installation

**Option A: VS Code Marketplace (Recommended)**
1. Open VS Code
2. Go to Extensions (`Cmd+Shift+X` / `Ctrl+Shift+X`)
3. Search for `bridge_dot_one` or `postboxen.bridge-dot-one`
4. Click Install

**Option B: Manual Installation**
1. Download the `.vsix` file from [Releases](https://github.com/DanielWarg/dot-bridge-vscode/releases).
2. In VS Code, open Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`).
3. Type: `Extensions: Install from VSIX...`
4. Select the downloaded `.vsix` file.

### 5.3 Usage

1. Highlight your raw text in VS Code.
2. Press `Cmd+Shift+B` (Mac) or `Ctrl+Shift+B` (Win/Linux).
3. Review output in the side-by-side preview window.

**Output Format:**
The extension transforms your text into a professional Status Update format with:
- **Summary:** Key issue or action item
- **Context:** Technical explanation
- **Next Steps:** Concrete actions

All output is formatted as clean Markdown with proper line breaks.

## 6.0 / CONFIGURATION

| Setting | Default | Description |
|---------|---------|-------------|
| `bridge.model` | `mistral` | The local brain to use. |
| `bridge.targetLanguage` | `English` | Output language. Set to `Swedish` for localization. |
| `bridge.apiBaseUrl` | `http://localhost:11434` | Keep it local. |

## 7.0 / COMMERCIAL & ENTERPRISE

Need to deploy **bridge_dot_one** in a restricted environment with a centralized inference server?

The Enterprise License unlocks:

* **Remote Server Access:** Configure `bridge.apiBaseUrl` to point to internal GPU clusters (Azure/AWS/On-prem).
* **Centralized Configuration:** Enforce settings via Group Policy.
* **Support & SLA:** Priority implementation support.

📩 **Contact:** [daniel@postboxen.se](mailto:daniel@postboxen.se) for licensing and volume pricing.

---

**Built by developers who would rather write code than emails.**
