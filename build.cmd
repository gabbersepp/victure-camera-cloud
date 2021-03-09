CD cam-server-backend
CALL docker build -t gabbersepp/cam-server-backend .
CALL docker push gabbersepp/cam-server-backend

CD ../cam-server-backup
CALL docker build -t gabbersepp/cam-server-backup .
CALL docker push gabbersepp/cam-server-backup

CD ../cam-server-memory-cleanup
CALL docker build -t gabbersepp/cam-server-memory-cleanup .
CALL docker push gabbersepp/cam-server-memory-cleanup

CD ../cam-proxy
CALL docker build -t gabbersepp/cam-proxy .
CALL docker push gabbersepp/cam-proxy

CD ../cam-client/backend
CALL docker build -t gabbersepp/cam-client-backend .
CALL docker push gabbersepp/cam-client-backend

CD ../frontend
CALL docker build -t gabbersepp/cam-client-frontend .
CALL docker push gabbersepp/cam-client-frontend

CD ../../
CALL kubectl delete -f .\deployment.yaml
CALL kubectl apply -f .\deployment.yaml