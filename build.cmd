CD cam-server-backend
CALL docker build -t gabbersepp/cam-server-backend .
CALL docker push gabbersepp/cam-server-backend

CD ../cam-server-backup
CALL docker build -t gabbersepp/cam-server-backup .
CALL docker push gabbersepp/cam-server-backup

CD ../cam-server-memory-cleanup
CALL docker build -t gabbersepp/cam-server-memory-cleanup .
CALL docker push gabbersepp/cam-server-memory-cleanup

CD ..
CALL kubectl apply -f deployment.yaml