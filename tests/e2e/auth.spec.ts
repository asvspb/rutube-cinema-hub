import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Ждём готовности API
    await page
      .waitForResponse(resp => resp.url().includes('/api/health') && resp.status() === 200, {
        timeout: 10000,
      })
      .catch(() => {}); // Игнорируем если нет health endpoint

    await page.goto('/');
  });

  test('should open auth modal when clicking login button', async ({ page }) => {
    // Открыть меню пользователя
    await page.click('button[title="Меню пользователя"]');
    await expect(page.locator('text=Гость')).toBeVisible();

    // Нажать кнопку "Войти"
    await page.click('text=Войти');

    // Проверить, что модальное окно открылось (используем role)
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    await expect(page.locator('input#username')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
  });

  test('should show validation errors for invalid inputs', async ({ page }) => {
    // Открыть модальное окно
    await page.click('button[title="Меню пользователя"]');
    await page.click('text=Войти');

    // Попробовать отправить пустую форму
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Проверить ошибку валидации
    await expect(page.locator('text=Username is required')).toBeVisible();
  });

  test('should switch between login and register modes', async ({ page }) => {
    // Открыть модальное окно
    await page.click('button[title="Меню пользователя"]');
    await page.click('text=Войти');

    // Проверить, что режим логин
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();

    // Переключиться на регистрацию
    await page.click('text=Sign up');
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();

    // Переключиться обратно
    await page.click('text=Sign in');
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
  });

  test('should register a new user', async ({ page }) => {
    const uniqueUsername = `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    // Открыть модальное окно и переключиться на регистрацию
    await page.click('button[title="Меню пользователя"]');
    await page.click('text=Войти');
    await page.click('text=Sign up');

    // Заполнить форму
    await page.fill('input#username', uniqueUsername);
    await page.fill('input#password', 'password123');

    // Отправить форму и ждать ответа (registration returns 201 Created)
    const responsePromise = page.waitForResponse(
      resp =>
        resp.url().includes('/api/auth/register') &&
        (resp.status() === 200 || resp.status() === 201),
      { timeout: 10000 }
    );
    await page.getByRole('button', { name: 'Create Account' }).click();
    await responsePromise;

    // Проверить, что модальное окно закрылось (пользователь авторизован)
    await expect(page.getByRole('heading', { name: 'Create Account' })).not.toBeVisible({
      timeout: 10000,
    });

    // Проверить, что пользователь виден как авторизованный
    await page.click('button[title="Меню пользователя"]');
    await expect(page.locator('text=Пользователь')).toBeVisible();
    await expect(page.locator('text=Аккаунт')).toBeVisible();
  });

  test('should login existing user', async ({ page }) => {
    // Сначала зарегистрируем пользователя через API (более надежно)
    const uniqueUsername = `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    // Регистрация через API
    const registerResponse = await page.request.post('/api/auth/register', {
      data: { username: uniqueUsername, password: 'password123' },
    });
    expect(registerResponse.status()).toBe(201);

    // Перезагрузить страницу
    await page.reload();

    // Открыть меню и войти
    await page.click('button[title="Меню пользователя"]');
    await page.click('text=Войти');

    await page.fill('input#username', uniqueUsername);
    await page.fill('input#password', 'password123');

    // Ждать ответа логина
    const loginPromise = page.waitForResponse(
      resp => resp.url().includes('/api/auth/login') && resp.status() === 200,
      { timeout: 10000 }
    );
    await page.getByRole('button', { name: 'Sign In' }).click();
    await loginPromise;

    // Проверить успешный вход
    await expect(page.getByRole('heading', { name: 'Sign In' })).not.toBeVisible({
      timeout: 10000,
    });

    await page.click('button[title="Меню пользователя"]');
    await expect(page.locator('text=Пользователь')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Открыть модальное окно
    await page.click('button[title="Меню пользователя"]');
    await page.click('text=Войти');

    // Ввести несуществующие данные
    await page.fill('input#username', 'nonexistent_user_12345');
    await page.fill('input#password', 'wrongpassword123');

    // Ждать ответа с ошибкой
    const responsePromise = page.waitForResponse(
      resp => resp.url().includes('/api/auth/login') && resp.status() === 401,
      { timeout: 10000 }
    );
    await page.getByRole('button', { name: 'Sign In' }).click();
    await responsePromise;

    // Проверить ошибку (API returns: "Username or password is incorrect")
    await expect(page.locator('text=incorrect')).toBeVisible({ timeout: 5000 });
  });

  test('should close modal on X button click', async ({ page }) => {
    // Открыть модальное окно
    await page.click('button[title="Меню пользователя"]');
    await page.click('text=Войти');
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();

    // Закрыть по X
    await page.click('button[aria-label="Close"]');
    await expect(page.getByRole('heading', { name: 'Sign In' })).not.toBeVisible();
  });

  test('should close modal on backdrop click', async ({ page }) => {
    // Открыть модальное окно
    await page.click('button[title="Меню пользователя"]');
    await page.click('text=Войти');
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();

    // Кликнуть по фону (outside modal)
    await page.mouse.click(10, 10);
    await expect(page.getByRole('heading', { name: 'Sign In' })).not.toBeVisible();
  });
});
