Before we commit: 
If not told otherwise, focus only on the changes that you made! It is likely that there are also other changes in the working directory, done by other models in other chats. Be careful only to commit the changes you made!

Do a `git diff` to look at all the changes and build a thorough understanding of what was changed.
Double check that all of your changes are save to deploy in production and don't harm any existing logic we have there.
Make sure the functionality that has been touched is thoroughly covered by adequate tests.
ABORT IF THE CHANGES ARE NOT SAVE!

Commit your changes, using this format for the commit message: <fix|feat(of_what):> <problem_description+solution_description|added_functionality_description> (using either fix or feat with one word of what was changed, followed by a `:` and then either a description of the fix, stating `Problem:` and `Solution:` or a description of the added functionality `Added:` and `Why:` with the respective minimal but comprehensive descriptions after each of them).