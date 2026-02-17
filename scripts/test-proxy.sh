#!/bin/bash

# =============================================================================
# Proxy Test Script
# Тестирование proxy endpoint и диагностика ошибок
# =============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

BACKEND_URL="${BACKEND_URL:-http://localhost:9230}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:9229}"

# Тестовые URL для проверки
TEST_URLS=(
  "https://rutube.ru/api/video/person/32869212/?client=android&format=json"
  "https://rutube.ru/api/video/person/32181632/?client=android&format=json"
  "https://rutube.ru/channel/32869212/videos/"
)

print_header() {
  echo -e "\n${BLUE}========================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}========================================${NC}\n"
}

print_status() {
  echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
  echo -e "${RED}✗${NC} $1"
}

# =============================================================================
# Test 1: Check if services are running
# =============================================================================
print_header "Тест 1: Проверка доступности сервисов"

# Check backend
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/health" 2>/dev/null || echo "000")
if [[ "$BACKEND_STATUS" == "200" ]]; then
  print_status "Backend доступен: $BACKEND_STATUS"
else
  print_error "Backend НЕ доступен: $BACKEND_STATUS"
  exit 1
fi

# Check frontend
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL/" 2>/dev/null || echo "000")
if [[ "$FRONTEND_STATUS" == "200" ]]; then
  print_status "Frontend доступен: $FRONTEND_STATUS"
else
  print_warning "Frontend НЕ доступен: $FRONTEND_STATUS"
fi

# =============================================================================
# Test 2: Direct API test (without proxy)
# =============================================================================
print_header "Тест 2: Прямой запрос к Rutube API (без proxy)"

for url in "${TEST_URLS[@]}"; do
  echo "Тест: $url"
  START_TIME=$(date +%s%N)
  
  RESPONSE=$(curl -s -o /tmp/direct_response.json -w "%{http_code}" "$url" 2>/dev/null || echo "000")
  
  END_TIME=$(date +%s%N)
  DURATION=$(( (END_TIME - START_TIME) / 1000000 ))
  
  if [[ "$RESPONSE" == "200" ]]; then
    SIZE=$(wc -c < /tmp/direct_response.json)
    print_status "Прямой запрос: HTTP $RESPONSE (${DURATION}ms, ${SIZE} bytes)"
    
    # Проверка на JSON
    if head -c 1 /tmp/direct_response.json | grep -q '{'; then
      echo "  └─ Формат: JSON ✓"
    else
      echo "  └─ Формат: HTML (не JSON) ⚠"
    fi
  else
    print_error "Прямой запрос: HTTP $RESPONSE"
  fi
  echo ""
done

# =============================================================================
# Test 3: Proxy endpoint test
# =============================================================================
print_header "Тест 3: Тестирование proxy endpoint"

for url in "${TEST_URLS[@]}"; do
  echo "Тест: $url"
  START_TIME=$(date +%s%N)
  
  # Кодируем URL для передачи в query parameter
  ENCODED_URL=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$url', safe=''))" 2>/dev/null || echo "")
  
  if [[ -z "$ENCODED_URL" ]]; then
    # Fallback для систем без python3
    ENCODED_URL=$(echo "$url" | sed 's/ /%20/g; s/:/%3A/g; s/\//%2F/g; s/?/%3F/g; s/&/%26/g; s/=/%3D/g')
  fi
  
  RESPONSE=$(curl -s -o /tmp/proxy_response.json -w "%{http_code}" "$BACKEND_URL/api/proxy?url=$ENCODED_URL" 2>/dev/null || echo "000")
  
  END_TIME=$(date +%s%N)
  DURATION=$(( (END_TIME - START_TIME) / 1000000 ))
  
  if [[ "$RESPONSE" == "200" ]]; then
    SIZE=$(wc -c < /tmp/proxy_response.json)
    print_status "Proxy запрос: HTTP $RESPONSE (${DURATION}ms, ${SIZE} bytes)"
    
    # Проверка на JSON
    if head -c 1 /tmp/proxy_response.json | grep -q '{'; then
      echo "  └─ Формат: JSON ✓"
      
      # Проверка на наличие ошибок в ответе
      if grep -q '"error"' /tmp/proxy_response.json; then
        echo "  └─ Содержит 'error': ⚠"
        grep -o '"error"[^,}]*' /tmp/proxy_response.json | head -1
      fi
      
      # Проверка на has_next (для API видео)
      if grep -q '"has_next"' /tmp/proxy_response.json; then
        echo "  └─ Содержит 'has_next': ✓"
      fi
    else
      echo "  └─ Формат: HTML (не JSON) ⚠"
      echo "  └─ Первые 200 символов:"
      head -c 200 /tmp/proxy_response.json | sed 's/^/     /'
      echo ""
    fi
  else
    print_error "Proxy запрос: HTTP $RESPONSE"
    
    # Показать ошибку
    if [[ -s /tmp/proxy_response.json ]]; then
      echo "  └─ Ответ сервера:"
      cat /tmp/proxy_response.json | sed 's/^/     /'
    fi
  fi
  echo ""
done

# =============================================================================
# Test 4: DNS resolution test
# =============================================================================
print_header "Тест 4: Проверка DNS resolution"

echo "DNS resolution для rutube.ru:"
nslookup rutube.ru 2>/dev/null || dig rutube.ru 2>/dev/null || echo "  nslookup/dig недоступны"
echo ""

# =============================================================================
# Test 5: Docker container logs analysis
# =============================================================================
print_header "Тест 5: Анализ логов Docker"

cd "$(dirname "$0")/.." || exit 1

echo "Последние ошибки в логах backend:"
docker-compose logs --tail=50 backend 2>/dev/null | grep -E "(error|Error|failed)" | tail -10 || echo "  Ошибок не найдено"
echo ""

echo "Количество ошибок 'All proxies failed' за последние 5 минут:"
ERROR_COUNT=$(docker-compose logs --since=5m backend 2>/dev/null | grep -c "All proxies failed" || echo "0")
echo "  $ERROR_COUNT"
echo ""

# =============================================================================
# Test 6: Container resource usage
# =============================================================================
print_header "Тест 6: Использование ресурсов контейнерами"

docker-compose ps 2>/dev/null || echo "docker-compose недоступен"
echo ""

# =============================================================================
# Summary
# =============================================================================
print_header "Итоги тестирования"

echo "Дата: $(date)"
echo "Backend URL: $BACKEND_URL"
echo "Frontend URL: $FRONTEND_URL"
echo ""

# Проверка последнего proxy ответа
if [[ -f /tmp/proxy_response.json ]]; then
  if head -c 1 /tmp/proxy_response.json | grep -q '{'; then
    print_status "Proxy возвращает JSON"
  else
    print_error "Proxy возвращает HTML вместо JSON"
  fi
fi

echo ""
echo "Для детальной отладки используйте:"
echo "  docker-compose logs -f backend"
echo "  curl -v '$BACKEND_URL/api/proxy?url=<encoded_url>'"
echo ""

# Cleanup
rm -f /tmp/direct_response.json /tmp/proxy_response.json
