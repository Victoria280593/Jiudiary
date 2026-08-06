import { inputClass, labelClass } from "@/lib/ui";

export function PersonalDataForm({ name, email }: { name: string; email: string }) {
  return (
    <form className="flex flex-col gap-4">
      <p className="text-sm text-muted">Редактирование профиля временно недоступно.</p>
      <fieldset disabled className="flex flex-col gap-4 opacity-60">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="personalName" className={labelClass}>
            Имя и фамилия
          </label>
          <input
            id="personalName"
            name="personalName"
            type="text"
            defaultValue={name}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="personalPhone" className={labelClass}>
            Телефон
          </label>
          <input
            id="personalPhone"
            name="personalPhone"
            type="tel"
            autoComplete="tel"
            placeholder="+7 999 000-00-00"
            className={inputClass}
          />
        </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="personalCity" className={labelClass}>
            Город
          </label>
          <input
            id="personalCity"
            name="personalCity"
            type="text"
            autoComplete="address-level2"
            placeholder="Укажите город"
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="personalEmail" className={labelClass}>
            Электронная почта
          </label>
          <input
            id="personalEmail"
            type="email"
            value={email}
            readOnly
            className={`${inputClass} bg-surface-muted text-muted`}
          />
        </div>
        </div>
      </fieldset>
    </form>
  );
}
