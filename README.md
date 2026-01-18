# fans-munch

## Setup

cd client
npm run build
Copy the new build to server:
powershell
cp -r build ../server/
Deploy to Heroku (from the root folder):
powershell
cd ..
git add .
git commit -m "Updated to live Stripe keys"
git branch -D heroku-deploy
git subtree split --prefix server -b heroku-deploy
git push heroku heroku-deploy:main --force