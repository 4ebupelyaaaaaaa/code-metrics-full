import { Rule } from "antd/es/form";

export const usernameRules: Rule[] = [
  { required: true, message: "Введите логин" },
  { min: 3, max: 20, message: "Логин должен содержать от 3 до 20 символов" },
  {
    pattern: /^[A-Za-z0-9_]+$/,
    message: "Логин может содержать только буквы, цифры и символ «_»",
  },
];

export const passwordRules: Rule[] = [
  { required: true, message: "Введите пароль" },
  { min: 6, message: "Пароль должен быть не менее 6 символов" },
  {
    pattern: /^(?=.*[A-Za-z])(?=.*\d).+$/,
    message: "Пароль должен содержать хотя бы одну букву и одну цифру",
  },
];
