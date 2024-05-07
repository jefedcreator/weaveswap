"use client";
import ReactSelect, { components } from "react-select";
import Image from "next/image";
import { GroupBase, SingleValue, SelectInstance } from "react-select";
import { forwardRef } from "react";
import { IconType } from "@/components";

type Option = {
  value: string;
  label: string;
  icon?: {
    1: IconType;
    2?: string;
  };
};

interface SelectProps {
  isSearchable?: boolean;
  option: Option[];
  inputId: string;
  onChange?: (value: SingleValue<Option>) => void;
  // onBlur?: Noop;
  placeholder?: string;
  maxHeightMenuList?: string;
  value?: Option;
  selectClassName?: string;
}

export type SelectRef = SelectInstance<Option, false, GroupBase<Option>>;

/**
 * Select without Search
 */
const Select = forwardRef<SelectRef, SelectProps>(
  (
    {
      inputId,
      maxHeightMenuList,
      isSearchable,
      onChange,

      option,
      placeholder,
      value,
    },
    ref,
  ) => {
    return (
      <ReactSelect
        isSearchable={isSearchable}
        ref={ref}
        inputId={inputId}
        components={{
          IndicatorSeparator: null,
        }}
        onChange={onChange}
        // onBlur={onBlur}
        placeholder={placeholder}
        options={option}
        getOptionValue={(option) => option.value}
        formatOptionLabel={(option) => {
          const label = option.label;
          const iconPresent = option.icon;
          const secondIcon = option.icon?.[2];
          return (
            <div className="flex items-center gap-4">
              {iconPresent ? (
                <div className="flex gap-1">
                  <Image
                    src={`/${option.icon?.[1]}.svg`}
                    alt=""
                    height="24"
                    width="24"
                  />
                  {secondIcon ? (
                    <Image
                      src={`/assets/svgs/${option.icon?.[2]}.svg`}
                      alt=""
                      height="24"
                      width="24"
                    />
                  ) : null}
                </div>
              ) : null}
              <span>{label}</span>
            </div>
          );
        }}
        styles={{
          control: (base, state) => ({
            padding: "0.75rem 0.75rem",
            fontSize: "0.875rem",
            fontWeight: 600,
            height: "3rem",
            color: "#000",
            backgroundColor: "transparent",
            caretColor: "transparent",
            // boxShadow: state.isFocused
            //   ? "0px 0px 0px 3px #CFEDD6, 0px 2px 2px -1px #E4F5E8"
            //   : "none",
            display: "flex",
            alignItems: "center",
          }),
          valueContainer: (base) => ({
            ...base,
            border: "none",
            // color: "#525C76",
            paddingLeft: 0,
          }),
          indicatorsContainer: (base, props) => ({
            ...base,
            "& > div": {
              paddingLeft: 0,
            },
          }),
          menu: (base) => ({
            ...base,
            border: "none",
            boxShadow: "none",
          }),
          menuList: (base) => ({
            ...base,
            visibility: "visible",
            display: "flex",
            flexDirection: "column",
            background: "#fff",
            fontSize: "14px",
            border: "1px solid #F3F4F6",
            maxHeight: `${maxHeightMenuList}`,
            gap: "8px",
            borderRadius: "0.5rem",
            boxShadow: "0px 4px 8px 0px rgba(9, 23, 74, 0.12);",
            overflowY: "auto",
            marginBottom: "30px",
          }),
          option: (base, state) => ({
            ...base,
            fontSize: "0.875rem",
            backgroundColor: state.isFocused ? "#4AB863" : "",
            fontWeight: 600,
            color: state.isFocused ? "#fff" : "#424A59",
            ":active": {
              backgroundColor: "#4AB863",
            },
          }),
          dropdownIndicator: (base) => ({
            ...base,
            color: "#525C76",
          }),
          singleValue: (base) => ({
            ...base,
            color: "#525C76",
          }),
        }}
        value={value}
      />
    );
  },
);

export { Select };
