import { Switch, Form, Input } from "antd";
import {
  changeGlobalAttribute,
  setUserFieldValue,
  setUserRoles,
  useUserCardContext,
} from "../../../../context/user/context";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  FocusEvent,
  FC,
} from "react";
import { UserRole } from "../../../../../../shared/api/users/get-user-card";
import { useQuery } from "@tanstack/react-query";
import { getTableRoles } from "../../../../../../shared/api/roles/get-table-roles";
import { Selectbox } from "../../../../../../shared/components/selectbox/selectbox";
import {
  confirmPasswordCheck,
  emailPatternRule,
  maxRule,
  minRule,
  noContainsOnStartOrEndRule,
  onlyCyrillicCapitalizeRule,
  onlyCyrillicRule,
  requiredArrayRule,
  requiredRule,
  userExistsRule,
  userNameRule,
} from "../../../../../../shared/constants/form-rules";
import { AttributeField } from "../attributes/attribute-field";
import "./user-card-edit-personal.css";
import dayjs from "dayjs";
import { getSettingsByType } from "../../../../../../shared/api/settings/get-settings-by-type";
import { trimAndCapitalize } from "../../../../../../shared/utils/trim-and-capitalize";
import { PasswordInput } from "../../../../../../shared/components/password-input";
import { PasswordGenerator } from "../../../../../../shared/services/generate-password";
import { MaskedInput } from "../../../../../../shared/components/masked-input";
import { DatePicker } from "../../../../../../shared/components/datepicker/datepicker";
import { usePasswordValidationRules } from "../../../../../../shared/hooks/use-password-validation-rules";
import { EditableUser } from "../../../../context/user/types";

type SelectOption = {
  label: string;
  value: string;
  disabled?: boolean;
};

type Props = {
  edit?: boolean;
};

export const UserCardEditPersonal: FC<Props> = ({ edit }) => {
  const [form] = Form.useForm();
  const roleListRef = useRef<SelectOption[]>([]);
  const { user, dispatch, validate } = useUserCardContext();
  const [searchRoleValue, setSearchRoleValue] = useState("");

  const passwrodPolicyQuery = useQuery(
    ["password-policy"],
    () => getSettingsByType("password"),
    {
      refetchOnWindowFocus: false,
      initialData: {
        settings: [],
      },
    }
  );

  const rules = usePasswordValidationRules(
    passwrodPolicyQuery.data.settings,
    !edit
  );

  const onGenerateClick = useCallback(async () => {
    const username = form.getFieldValue("username");
    const newPassword = await PasswordGenerator.generate(
      username,
      passwrodPolicyQuery.data.settings
    );
    form.setFieldsValue({
      password: newPassword,
      passwordConfirm: newPassword,
    });
    dispatch(setUserFieldValue({ field: "password", value: newPassword }));
    dispatch(
      setUserFieldValue({ field: "passwordConfirm", value: newPassword })
    );
  }, [passwrodPolicyQuery.data.settings, form, dispatch]);

  const rolesQuery = useQuery(
    ["roles-list", searchRoleValue],
    () =>
      getTableRoles({ name: searchRoleValue }).then((data) =>
        data.items.map(
          (item) =>
            ({
              value: item.id,
              label: item.name,
              disabled: !!item.deleteDate,
            } as SelectOption)
        )
      ),
    {
      initialData: [],
    }
  );

  useEffect(() => {
    roleListRef.current = rolesQuery.data;
  }, [rolesQuery.data]);

  useEffect(() => {
    form.setFieldsValue({
      ...user,
      roles: (user?.roles || []).map((r) => r.id),
      ...(user?.globalAttributes || []).reduce((prev, next) => {
        return {
          ...prev,
          [next.attributeId]: next.values,
        };
      }, {} as any),
      validTo: user?.validTo && dayjs(user?.validTo, "YYYY-MM-DD"),
    });
  }, [user, form]);

  const onFormChange = useCallback(
    (values: any) => {
      Object.keys(values).forEach((key) => {
        if (key === "roles") {
          const newRoles: UserRole[] = (values[key] as string[])
            .map((r: string) => roleListRef.current.find((e) => e.value === r))
            .filter((r) => !!r)
            .map((r) => ({
              id: r!.value as string,
              name: r!.label as string,
            }));
          dispatch(setUserRoles(newRoles));
        } else if (key === "accountLocked") {
          dispatch(
            setUserFieldValue({
              field: "accountNonLocked",
              value: !values[key],
            })
          );
          dispatch(
            setUserFieldValue({
              field: "accountLocked" as any,
              value: values[key],
            })
          );
        } else if (key.startsWith("attributes.")) {
          dispatch(
            changeGlobalAttribute({
              key,
              values: values[key],
            })
          );
        } else if (key === "validTo") {
          dispatch(
            setUserFieldValue({
              field: key as keyof EditableUser,
              value: values[key] && values[key].format("YYYY-MM-DD"),
            })
          );
        } else if (
          key === "lastName" ||
          key === "firstName" ||
          key === "patronymic"
        ) {
          dispatch(
            setUserFieldValue({
              field: key as keyof EditableUser,
              value: trimAndCapitalize(values[key]),
            })
          );
        } else {
          dispatch(
            setUserFieldValue({
              field: key as keyof EditableUser,
              value: values[key],
            })
          );
        }
      });
    },
    [dispatch]
  );

  const onInputBlur = useCallback((event: FocusEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value) {
      const trimmed = value.trim();
      if (trimmed !== value) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value"
        )?.set;
        nativeInputValueSetter?.call(event.target, trimmed);

        const changeEvent = new Event("input", { bubbles: true });
        event.target.dispatchEvent(changeEvent);
      }
    }
  }, []);

  useEffect(() => {
    if (validate) {
      form.validateFields();
    }
  }, [validate, form]);

  return (
    <div className="unigate-user-card__personal scroll-wrapper">
      <Form
        labelCol={{ span: 7 }}
        labelWrap
        wrapperCol={{ span: 10 }}
        form={form}
        onValuesChange={onFormChange}
        autoComplete="off"
      >
        <Form.Item
          name="lastName"
          label="Фамилия"
          required
          rules={
            user?.nameEditable === false
              ? []
              : [
                  requiredRule,
                  onlyCyrillicRule,
                  onlyCyrillicCapitalizeRule,
                  noContainsOnStartOrEndRule,
                  minRule(2),
                  maxRule(40),
                ]
          }
          validateFirst
        >
          <Input
            maxLength={40}
            onBlur={onInputBlur}
            disabled={user?.nameEditable === false}
          />
        </Form.Item>
        <Form.Item
          name="firstName"
          label="Имя"
          required
          rules={
            user?.nameEditable === false
              ? []
              : [
                  requiredRule,
                  onlyCyrillicRule,
                  onlyCyrillicCapitalizeRule,
                  noContainsOnStartOrEndRule,
                  minRule(2),
                  maxRule(40),
                ]
          }
          validateFirst
        >
          <Input
            maxLength={40}
            onBlur={onInputBlur}
            disabled={user?.nameEditable === false}
          />
        </Form.Item>
        <Form.Item
          name="patronymic"
          label="Отчество"
          rules={
            user?.nameEditable === false
              ? []
              : [
                  onlyCyrillicRule,
                  onlyCyrillicCapitalizeRule,
                  noContainsOnStartOrEndRule,
                  minRule(2),
                  maxRule(40),
                ]
          }
          validateFirst
        >
          <Input
            maxLength={40}
            onBlur={onInputBlur}
            disabled={user?.nameEditable === false}
          />
        </Form.Item>
        <Form.Item name="post" label="Должность" rules={[maxRule(160)]}>
          <Input onBlur={onInputBlur} />
        </Form.Item>
        <Form.Item
          name="email"
          label="Адрес электронной почты"
          rules={[requiredRule, emailPatternRule, maxRule(160)]}
          validateFirst
        >
          <Input />
        </Form.Item>
        <Form.Item name="phone" label="Контактный телефон">
          <MaskedInput mask="+7 (000) 000-00-00" />
        </Form.Item>
        <Form.Item
          name="username"
          label="Логин"
          rules={
            edit
              ? undefined
              : [requiredRule, userNameRule, userExistsRule, maxRule(30)]
          }
          validateFirst
        >
          <Input disabled={edit} />
        </Form.Item>
        <Form.Item
          name="password"
          label="Пароль"
          rules={rules}
          validateFirst
          required={!edit}
        >
          <PasswordInput
            autoComplete="off"
            showGenerate
            onGenerateClick={onGenerateClick}
          />
        </Form.Item>
        <Form.Item
          name="passwordConfirm"
          label="Подтверждение пароля"
          rules={[confirmPasswordCheck]}
          required={!edit}
        >
          <Input.Password autoComplete="off" />
        </Form.Item>
        {(user?.globalAttributes || []).map((attr) => (
          <Form.Item
            key={attr.attributeId}
            name={attr.attributeId}
            label={attr.name}
            required={attr.required}
          >
            <AttributeField
              clearable={!attr.required}
              multiple={attr.multiple}
              dictionaryAttributeId={attr.dictionaryAttributeId}
              attributeType={attr.attributeType}
            />
          </Form.Item>
        ))}
        <Form.Item
          name="roles"
          label="Роль"
          required
          rules={[requiredArrayRule]}
        >
          <Selectbox
            onSearch={setSearchRoleValue}
            options={rolesQuery.data}
            loading={rolesQuery.isLoading}
            mode="multiple"
          />
        </Form.Item>
        <Form.Item
          name="accountLocked"
          label="Заблокировать учётную запись"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) =>
            prevValues.accountLocked !== currentValues.accountLocked
          }
        >
          {({ getFieldValue }) =>
            getFieldValue("accountLocked") ? (
              <Form.Item name="blockComment" label="Комментарий блокировки">
                <Input />
              </Form.Item>
            ) : null
          }
        </Form.Item>
        <Form.Item
          name="changePassword"
          label="Потребовать смену пароля при следующем входе в систему"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
        <Form.Item
          name="sessionMaxCount"
          label="Максимальное число активных сессий"
        >
          <Input type="number" min={0} max={9} maxLength={1} />
        </Form.Item>
        <Form.Item name="validTo" label="Действителен до">
          <DatePicker allowClear format="DD.MM.YYYY" placeholder="дд.мм.гггг" />
        </Form.Item>
      </Form>
    </div>
  );
};
