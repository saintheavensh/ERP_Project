Book-04-Shared-Components

@(
"INDEX.md",
"00-Preface.md",
"B04-CH01-Design-Principles.md",
"B04-CH02-UI-Components.md",
"B04-CH03-Layout-Components.md",
"B04-CH04-Form-Components.md",
"B04-CH05-Data-Display-Components.md",
"B04-CH06-Feedback-Components.md",
"B04-CH07-Navigation-Components.md",
"B04-CH08-Widget-Framework.md",
"B04-CH09-Utility-Libraries.md",
"B04-CH10-Shared-Hooks.md",
"B04-CH11-Shared-Types.md",
"B04-CH12-Internationalization.md",
"B04-C13-Shared-Components-Summary.md"
) | ForEach-Object { New-Item -ItemType File $_ }

