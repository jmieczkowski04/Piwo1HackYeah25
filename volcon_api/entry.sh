
echo "Waiting for Typesense..."
until curl -fsS http://typesense:8108/health > /dev/null; do
  sleep 1
done
echo "Typesense is healthy."

python sync_typesense.py

python manage.py runserver 0.0.0.0:8000