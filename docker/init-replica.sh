#!/usr/bin/env bash
set -e

until mongosh --host mongo1:27017 --quiet --eval "db.adminCommand('ping')" >/dev/null 2>&1; do
  sleep 1
done

mongosh --host mongo1:27017 --quiet <<'EOF'
try {
  rs.status();
} catch (e) {
  rs.initiate({
    _id: "rs0",
    members: [
      { _id: 0, host: "mongo1:27017" },
      { _id: 1, host: "mongo2:27017" },
      { _id: 2, host: "mongo3:27017" }
    ]
  });
}
EOF
