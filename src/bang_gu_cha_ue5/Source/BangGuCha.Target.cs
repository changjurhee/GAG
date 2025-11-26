using UnrealBuildTool;
using System.Collections.Generic;

public class BangGuChaTarget : TargetRules
{
	public BangGuChaTarget( TargetInfo Target) : base(Target)
	{
		Type = TargetType.Game;
		DefaultBuildSettings = BuildSettingsVersion.V2;
		ExtraModuleNames.AddRange( new string[] { "BangGuCha" } );
	}
}
