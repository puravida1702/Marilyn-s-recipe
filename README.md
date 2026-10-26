# Marilyn's Recipe

Simple recipe app (installable PWA). Logo from the cookbook cover is the app icon.

## Publish with GitHub
1. Create a new repo on github.com (e.g. `marilyns-recipe`), then upload all these files (or run the commands below).
2. Repo → Settings → Pages → Source: **GitHub Actions**.
3. Open `https://<your-username>.github.io/marilyns-recipe/` on your phone → "Add to Home Screen".

```bash
git init -b main && git add . && git commit -m "Marilyn's Recipe app"
git remote add origin https://github.com/<your-username>/marilyns-recipe.git
git push -u origin main
```

Edit recipes in `recipes.js`. If you change files, bump `C='marilyn-v1'` in `sw.js` so phones refresh.

## Adding a recipe
Send the photo to Claude, get back an updated `recipes.js`, and replace that one file in the GitHub repo.
You can also tap **+ Add a recipe** in the app to type one (saved on that phone only).
