# How to Document
Document all things about the modules of our app here that will be important to know later on (efficiently and minimally). While the high level overview is reflected in `.cursor/rules/agents.mdc` the documentation in `docs/` focuses on the description of the CURRENT STATE AND CONTRIBUTION of the modules of our app.
This includes our MOST IMPORTANT Design Decisions and the reasons for them. Again: No detail decisions, but only those crucial for the overall functionality of our app. And again: Only focus on the current state, ACTIVELY REMOVE DEPRECATED INFORMATION! 

ALL documentation has to be minimal / efficient.

Minimal and efficient documentation also means that you should not not document things that are already well documented by other means. E.g. the detailed database schema is already well documented by the generated db types file that we continuously update via the supabase cli in `types/db/db.ts`. So focus rather on high level stuff in that case.

## Timing of Documentation
Documentation will be added, once we reached a stable state of a module and/or some functionality.
This will typically be the case whenever we want to commit something. SO: every time the user agrees to commit something, you will update the docs.
Every time you update the docs, you will also read the doc to see which documentation is deprecated and will remove it.

## Form of the documentation
The documentation of the modules 
The order of documents should roughly resemble the typical flow of data through the app.
Choose a prefix number like `01_` for the documents based on that.
Add a short description of what the file documents to the top. E.g. 
```md
# Database 
Documenting the most imporatnt entities of our app and their relevance to the app as a whole. Also explaining important design decisions for our data model.
```

An EXAMPLE for these documents would be:
- 00_database.md (e.g. high level architecture: the main entities of our data model and how they interact -- also design decisions: why we went for a certain relationship, etc.)
- 01_data_processing.md (e.g. initial processing and storage of data from external sources)
- 02_xy_management.md (e.g. setup / configuration of important flows of our app)
- 03_engine.md (e.g. some business logic that processes data in some way, providing main functionality)
Again: Don't use those exact names, choose an appropriate structure based on your overview (`.cursor/rules/agents.mdc`) of the app

<guiding principle for documentation>
Here's the thing: The documentation is for you, the agent, to be informed about future coding tasks. So choose a good abstraction of what is actually important to persist; to remember later on in order to be able to keep on building out the app.
Do not document details as these are well documented through the code itself.
Rather document the high level information relevant for the functionality of the app as a whole. Focus on the the main functions of our code.
Each document should be a service / module, describing its contribution towards the functionality as a whole.
Think of a house and it's components to make up the house: The living room, the bathroom, and the kitchen would be the modules / services of the house, since they all serve different purposes for the house as a whole (or the user living in it). Think the stove in the kitchen: think which functionality it provides to the kitchen and therefore to the house as a whole. What does the stove contribute in terms of functionality to the house as a whole? ("The stove can cook meals and therefore contributes to the user being able to satisfy their hunger). How is it therefore interconnected with other parts of the house? E.g. with the fridge providing resources for the stove (data being handed over to that module).

Main takeaways: 
- one document per service (room)
- high level descriptions of the functions (inventory) in that service (room)
- focus on the contributed functionality to the app (house) as a whole
- reflect the dependencies with other modules (rooms) of the app (house)

Make sure to use this metaphor of the house as a guiding principle. Do not get lost in it by sticking to closely to it: Rather APPLY it to our codebase (use it as analogy when deciding what is important to document).
</guiding principle for documentation>


