---
title: "Reviewing and Using AI Code"
date: 2026-09-29
draft: false
summary: "How do you ensure that the LLMs you are using for coding are actually doing a good job?"
tags: ["intro"]
---

### After working with AI coding agents for a while now, this is a list of things which I feel human developers have to keep in mind while using these tools:

1. You own the result no matter what. You cant blame it on AI. You have to either evaluate the code yourself or come up with a way that validates the code entirely. Note that the GenAI code may look ok but have subtle bugs. It is your responsibility to clear it because you are the one using the AI and it is not here to substitute you but rather to complement you.
2. Going by the result of unit test execution can be dangerous. In real life, I have personally seen UTs passing but the actual code being wrong because it is the agent that wrote the code as well as the UT. It has all the motivation to cook up the UTs to show all green. If an AI coding agent has misunderstood you, the UTs become totally useless.
3. Before you go ahead with understanding the code, understand the intent. Make sure you have understood the ticket. To do this, look at the Jira ticket, the failing test, or even the AI agent’s conversation history or plan. Visualize how the correct code should look like - where it should be, what functions may be needed etc. Keep that in mind while reviewing the AI generated code.
4. Run the existing unit tests, EUTs, formatting tools etc to catch any silly bugs and also as a quick sanity check.
5. Dont simply read the code from top to bottom. First see what each function is going to do, and roughly understand the intent of the code. Then follow the code flow. See how the function calls go, make sure the call sites are passing the right parameters etc
6. Check for common issues which even human developers make. This includes hardcoding secrets, not doing authorization checks, off-by-one bugs, conversion errors, logging statements being subpar, etc. The LLMs were trained on human-written code. So it makes sense that they also tend to make the same mistakes.
7. Dont rely on the AI agent’s comments entirely. The comments being right alone doesnt make the code right. Verify the comments and the code.
8. The code that the AI agent might be correct. But it might not follow the conventions of your team. See how well the AI generated code fits with the rest of the existing code.
9. Architecture always has to be more of a human decision. Using the AI to come up with ideas is fine, but the final call has to be yours.
